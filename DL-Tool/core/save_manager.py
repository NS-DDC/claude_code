"""Save/load helpers extracted from MainWindow to keep it lean.

This module owns all disk I/O that is related to persisting and restoring
label data (YOLO txt files, GT mask PNG files and the images/ copy).
"""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import TYPE_CHECKING

import cv2

from core.export_manager import ExportManager
from core.label_manager import LabelItem

if TYPE_CHECKING:
    from core.label_manager import LabelManager
    from core.project_manager import ProjectManager


class SaveManager:
    """Handles all label persistence for a single project session.

    Parameters
    ----------
    label_manager:
        The shared :class:`LabelManager` instance.
    project_manager:
        The shared :class:`ProjectManager` instance.
    """

    def __init__(
        self,
        label_manager: "LabelManager",
        project_manager: "ProjectManager",
    ) -> None:
        self._labels = label_manager
        self._project = project_manager

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def save_image_labels(
        self,
        image_path: str,
        class_names: dict[int, str],
        image_size: tuple[int, int],
    ) -> list[str]:
        """Persist labels for a single image and return a list of saved items.

        GT masks are always written as PNG (lossless).
        The original image is copied to ``images/`` using its original extension.

        Parameters
        ----------
        image_path:
            Absolute path to the source image.
        class_names:
            Mapping of ``class_id -> class_name`` used for YOLO txt serialisation.
        image_size:
            ``(width, height)`` of the image in pixels.

        Returns
        -------
        list[str]
            Human-readable descriptions of what was saved, e.g.
            ``["3 labels", "GT images (1 classes)", "image"]``.
        """
        labels = self._labels.get_labels(image_path)
        w, h = image_size
        if not labels or w == 0 or h == 0 or not self._project.image_dir:
            return []

        bbox_polygon = [l for l in labels if l.label_type in ("bbox", "polygon")]
        mask_labels = [l for l in labels if l.label_type == "mask"]
        saved: list[str] = []

        # ── YOLO txt ──────────────────────────────────────────────────
        label_path = self._project.get_label_path(image_path)
        if bbox_polygon:
            if label_path:
                ExportManager.save_yolo_txt(bbox_polygon, w, h, label_path, class_names)
                saved.append(f"{len(bbox_polygon)} labels")
        else:
            # Remove stale txt file if no bbox/polygon labels remain
            if label_path and Path(label_path).exists():
                Path(label_path).unlink()

        # ── GT mask PNGs (one per class, organised in gt_image/<class>/) ──
        if mask_labels:
            gt_dir = Path(self._project.image_dir) / "gt_image"
            img_file = Path(image_path)
            mask_class_names = set()
            for label in mask_labels:
                class_dir = gt_dir / label.class_name
                class_dir.mkdir(parents=True, exist_ok=True)
                gt_path = class_dir / (img_file.stem + ".png")
                ExportManager.save_semantic_mask(
                    [label], w, h, str(gt_path), multi_label=False
                )
                mask_class_names.add(label.class_name)

            # Create empty GT masks for classes that have a gt_image/<class>/
            # directory but no mask on this image, so training image counts
            # stay consistent across all segmentation classes.
            for cname in class_names.values():
                if cname not in mask_class_names:
                    class_dir = gt_dir / cname
                    if class_dir.is_dir():
                        gt_path = class_dir / (img_file.stem + ".png")
                        if not gt_path.exists():
                            ExportManager.save_semantic_mask(
                                [], w, h, str(gt_path), multi_label=False
                            )

            saved.append(f"GT images ({len(mask_labels)} classes)")

        # ── Copy original image ────────────────────────────────────────
        img_file = Path(image_path)
        images_dir = Path(self._project.image_dir) / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        dest = images_dir / img_file.name
        if not dest.exists():
            shutil.copy2(image_path, dest)
            saved.append("image")

        return saved

    def save_all_images(
        self,
        class_names: dict[int, str],
    ) -> tuple[int, int, int]:
        """Save every image that has labels.

        Returns
        -------
        tuple[int, int, int]
            ``(label_file_count, gt_image_count, image_copy_count)``
        """
        if not self._project.image_dir:
            return 0, 0, 0

        gt_dir = Path(self._project.image_dir) / "gt_image"
        images_dir = Path(self._project.image_dir) / "images"
        gt_dir.mkdir(parents=True, exist_ok=True)
        images_dir.mkdir(parents=True, exist_ok=True)

        label_count = gt_count = image_count = 0

        for img_path in self._project.image_list:
            labels = self._labels.get_labels(img_path)
            if not labels:
                continue

            img = cv2.imread(img_path)
            if img is None:
                continue
            h, w = img.shape[:2]

            bbox_polygon = [l for l in labels if l.label_type in ("bbox", "polygon")]
            mask_labels = [l for l in labels if l.label_type == "mask"]

            if bbox_polygon:
                lp = self._project.get_label_path(img_path)
                if lp:
                    ExportManager.save_yolo_txt(bbox_polygon, w, h, lp, class_names)
                    label_count += 1

            if mask_labels:
                img_file = Path(img_path)
                mask_class_names = set()
                for label in mask_labels:
                    class_dir = gt_dir / label.class_name
                    class_dir.mkdir(parents=True, exist_ok=True)
                    gt_path = class_dir / (img_file.stem + ".png")
                    ExportManager.save_semantic_mask(
                        [label], w, h, str(gt_path), multi_label=False
                    )
                    mask_class_names.add(label.class_name)

                # Create empty GT for classes with existing gt_image/ dirs
                for cname in class_names.values():
                    if cname not in mask_class_names:
                        class_dir = gt_dir / cname
                        if class_dir.is_dir():
                            gt_path = class_dir / (img_file.stem + ".png")
                            if not gt_path.exists():
                                ExportManager.save_semantic_mask(
                                    [], w, h, str(gt_path), multi_label=False
                                )

                gt_count += 1

            dest = images_dir / Path(img_path).name
            if not dest.exists():
                shutil.copy2(img_path, dest)
                image_count += 1

        return label_count, gt_count, image_count

    def delete_image_labels(self, image_path: str) -> None:
        """Remove the YOLO txt and any GT mask PNGs for *image_path*."""
        if not self._project.image_dir:
            return

        label_path = self._project.get_label_path(image_path)
        if label_path and Path(label_path).exists():
            Path(label_path).unlink()

        gt_dir = Path(self._project.image_dir) / "gt_image"
        if gt_dir.exists():
            img_stem = Path(image_path).stem
            for class_dir in gt_dir.iterdir():
                if class_dir.is_dir():
                    for ext in (".png", ".jpg", ".bmp", ".tiff"):
                        f = class_dir / (img_stem + ext)
                        if f.exists():
                            f.unlink()

    def load_labels_from_disk(
        self,
        image_path: str,
        image_size: tuple[int, int],
        class_names: dict[int, str],
        register_class_cb,
    ) -> list[LabelItem]:
        """Load labels (YOLO txt + GT masks) for *image_path* from disk.

        Parameters
        ----------
        image_path:
            Absolute path to the image.
        image_size:
            ``(width, height)`` of the image in pixels.
        class_names:
            Current ``class_id -> class_name`` mapping.
        register_class_cb:
            Callable ``(class_name: str) -> int`` that registers a new class
            and returns its index.  Called for each unseen class found on disk.

        Returns
        -------
        list[LabelItem]
            All labels loaded from disk.  Empty list if nothing found.
        """
        w, h = image_size
        if w == 0 or h == 0:
            return []

        all_labels: list[LabelItem] = []

        # ── YOLO txt ──────────────────────────────────────────────────
        label_path = self._project.get_label_path(image_path)
        if label_path and Path(label_path).is_file():
            labels = ExportManager.load_yolo_txt(label_path, w, h, class_names)
            for label in labels:
                if label.class_name not in {v for v in class_names.values()}:
                    new_idx = register_class_cb(label.class_name)
                    label.class_id = new_idx
                    class_names = {**class_names, new_idx: label.class_name}
            all_labels.extend(labels)

        # ── GT masks ──────────────────────────────────────────────────
        if self._project.image_dir:
            gt_dir = Path(self._project.image_dir) / "gt_image"
            if gt_dir.exists():
                # Auto-register classes from subdirectory names
                for class_dir in gt_dir.iterdir():
                    if class_dir.is_dir():
                        cname = class_dir.name
                        if cname not in {v for v in class_names.values()}:
                            new_idx = register_class_cb(cname)
                            class_names = {**class_names, new_idx: cname}

                # Reload class_names after potential new registrations
                gt_labels = ExportManager.load_gt_masks(
                    str(gt_dir), image_path, w, h, class_names
                )
                all_labels.extend(gt_labels)

        return all_labels
