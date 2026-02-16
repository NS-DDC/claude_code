"""Label export and import utilities for YOLO format and binary masks."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from core.label_manager import LabelItem, LabelManager
from core.project_manager import ProjectManager

logger = logging.getLogger(__name__)


class ExportManager:
    """Handles reading and writing label files in YOLO format as well as
    generating binary segmentation masks."""

    # ------------------------------------------------------------------
    # YOLO TXT – save
    # ------------------------------------------------------------------

    @staticmethod
    def save_yolo_txt(
        labels: list[LabelItem],
        image_width: int,
        image_height: int,
        output_path: str,
        class_names: dict[int, str] | None = None,
    ) -> None:
        """Save labels in YOLO annotation format with class name prefix.

        Line format::

            <class_name> <class_id> <cx> <cy> <w> <h>

        or for polygon/mask::

            <class_name> <class_id> <x1> <y1> <x2> <y2> ... <xn> <yn>

        Args:
            labels: List of ``LabelItem`` instances.
            image_width: Width of the source image in pixels.
            image_height: Height of the source image in pixels.
            output_path: Destination ``.txt`` file path.
            class_names: Optional mapping of class id to class name.
        """
        if image_width <= 0 or image_height <= 0:
            logger.error("Invalid image dimensions: %dx%d", image_width, image_height)
            return

        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        lines: list[str] = []
        for label in labels:
            if label.label_type == "bbox":
                line = ExportManager._bbox_to_yolo_line(
                    label, image_width, image_height
                )
            elif label.label_type == "polygon":
                line = ExportManager._polygon_to_yolo_line(
                    label, image_width, image_height
                )
            elif label.label_type == "mask":
                # Convert mask to polygon contours
                line = ExportManager._mask_to_yolo_line(
                    label, image_width, image_height
                )
            else:
                logger.warning("Unknown label type: %s", label.label_type)
                continue
            if line:
                lines.append(line)

        with open(out, "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines))
            if lines:
                fh.write("\n")

    @staticmethod
    def _bbox_to_yolo_line(
        label: LabelItem, img_w: int, img_h: int
    ) -> str:
        """Convert a bbox LabelItem to a YOLO detection line with class name."""
        xs = [p[0] for p in label.points]
        ys = [p[1] for p in label.points]
        x_min, x_max = min(xs), max(xs)
        y_min, y_max = min(ys), max(ys)

        cx = ((x_min + x_max) / 2.0) / img_w
        cy = ((y_min + y_max) / 2.0) / img_h
        w = (x_max - x_min) / img_w
        h = (y_max - y_min) / img_h

        return f"{label.class_name} {label.class_id} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}"

    @staticmethod
    def _polygon_to_yolo_line(
        label: LabelItem, img_w: int, img_h: int
    ) -> str:
        """Convert a polygon LabelItem to a YOLO segmentation line with class name."""
        coords: list[str] = []
        for x, y in label.points:
            coords.append(f"{x / img_w:.6f}")
            coords.append(f"{y / img_h:.6f}")
        return f"{label.class_name} {label.class_id} " + " ".join(coords)

    @staticmethod
    def _mask_to_yolo_line(
        label: LabelItem, img_w: int, img_h: int
    ) -> str:
        """Convert a mask LabelItem to YOLO segmentation line by finding contours."""
        if label.mask_data is None:
            return ""

        # Find contours in the mask
        contours, _ = cv2.findContours(
            label.mask_data, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        if not contours:
            return ""

        # Use the largest contour
        largest_contour = max(contours, key=cv2.contourArea)

        # Simplify contour to reduce point count
        epsilon = 0.005 * cv2.arcLength(largest_contour, True)
        approx = cv2.approxPolyDP(largest_contour, epsilon, True)

        # Convert to normalized coordinates
        coords: list[str] = []
        for point in approx:
            x, y = point[0]
            coords.append(f"{x / img_w:.6f}")
            coords.append(f"{y / img_h:.6f}")

        if len(coords) < 6:  # At least 3 points
            return ""

        return f"{label.class_name} {label.class_id} " + " ".join(coords)

    # ------------------------------------------------------------------
    # YOLO TXT – load
    # ------------------------------------------------------------------

    @staticmethod
    def load_yolo_txt(
        txt_path: str,
        image_width: int,
        image_height: int,
        class_names: dict[int, str],
    ) -> list[LabelItem]:
        """Load labels from a YOLO-format ``.txt`` annotation file.

        Supports both old format (class_id first) and new format
        (class_name class_id first) for backward compatibility.

        Args:
            txt_path: Path to the annotation file.
            image_width: Image width in pixels (for de-normalizing).
            image_height: Image height in pixels (for de-normalizing).
            class_names: Mapping of class id to class name.

        Returns:
            List of ``LabelItem`` instances.
        """
        path = Path(txt_path)
        if not path.is_file():
            return []

        labels: list[LabelItem] = []
        with open(path, "r", encoding="utf-8") as fh:
            for raw_line in fh:
                line = raw_line.strip()
                if not line:
                    continue
                parts = line.split()
                if len(parts) < 5:
                    continue

                # Detect format: new format has class_name as first token (non-numeric)
                try:
                    float(parts[0])
                    # Old format: class_id first
                    class_id = int(parts[0])
                    cls_name = class_names.get(class_id, str(class_id))
                    values = [float(v) for v in parts[1:]]
                except ValueError:
                    # New format: class_name class_id ...
                    cls_name = parts[0]
                    class_id = int(parts[1])
                    values = [float(v) for v in parts[2:]]

                if len(values) == 4:
                    # bbox: cx cy w h (normalized)
                    cx, cy, w, h = values
                    x_min = (cx - w / 2.0) * image_width
                    y_min = (cy - h / 2.0) * image_height
                    x_max = (cx + w / 2.0) * image_width
                    y_max = (cy + h / 2.0) * image_height
                    points = [
                        (x_min, y_min),
                        (x_max, y_min),
                        (x_max, y_max),
                        (x_min, y_max),
                    ]
                    label_type = "bbox"
                else:
                    # polygon: x1 y1 x2 y2 ... (normalized)
                    points = []
                    for i in range(0, len(values) - 1, 2):
                        px = values[i] * image_width
                        py = values[i + 1] * image_height
                        points.append((px, py))
                    label_type = "polygon"

                labels.append(
                    LabelItem(
                        class_id=class_id,
                        class_name=cls_name,
                        label_type=label_type,
                        points=points,
                        color=_color_for_class(class_id),
                    )
                )

        return labels

    # ------------------------------------------------------------------
    # GT mask loading
    # ------------------------------------------------------------------

    @staticmethod
    def load_gt_masks(
        gt_image_dir: str,
        image_path: str,
        image_width: int,
        image_height: int,
        class_names: dict[int, str],
    ) -> list[LabelItem]:
        """Load GT masks from gt_image/<class_name>/ directory structure.

        Args:
            gt_image_dir: Path to the gt_image/ directory.
            image_path: Path to the source image (used for matching filename).
            image_width: Image width in pixels.
            image_height: Image height in pixels.
            class_names: Mapping of class id to class name.

        Returns:
            List of ``LabelItem`` instances with mask_data loaded.
        """
        gt_dir = Path(gt_image_dir)
        if not gt_dir.exists():
            return []

        img_stem = Path(image_path).stem
        labels: list[LabelItem] = []

        # Reverse map: class_name -> class_id
        name_to_id = {name: cid for cid, name in class_names.items()}

        for class_dir in gt_dir.iterdir():
            if not class_dir.is_dir():
                continue

            class_name = class_dir.name
            class_id = name_to_id.get(class_name, -1)

            # Try to find matching mask file (any extension)
            for mask_file in class_dir.iterdir():
                if mask_file.is_file() and mask_file.stem == img_stem:
                    # Load mask
                    mask = cv2.imread(str(mask_file), cv2.IMREAD_GRAYSCALE)
                    if mask is None:
                        continue

                    # Resize if needed
                    if mask.shape != (image_height, image_width):
                        mask = cv2.resize(mask, (image_width, image_height),
                                         interpolation=cv2.INTER_NEAREST)

                    # Threshold to binary
                    mask = (mask > 0).astype(np.uint8) * 255

                    if mask.max() == 0:
                        continue

                    labels.append(
                        LabelItem(
                            class_id=class_id if class_id >= 0 else 0,
                            class_name=class_name,
                            label_type="mask",
                            points=[],
                            color=_color_for_class(class_id if class_id >= 0 else 0),
                            mask_data=mask,
                        )
                    )
                    break  # Only one mask per class per image

        return labels

    # ------------------------------------------------------------------
    # Binary mask export
    # ------------------------------------------------------------------

    @staticmethod
    def save_binary_mask(
        labels: list[LabelItem],
        image_width: int,
        image_height: int,
        output_path: str,
    ) -> None:
        """Render all labels as a single-channel binary mask and save as PNG."""
        mask = np.zeros((image_height, image_width), dtype=np.uint8)

        for label in labels:
            pts = np.array(label.points, dtype=np.int32)

            if label.label_type == "bbox":
                xs = pts[:, 0]
                ys = pts[:, 1]
                x1, x2 = int(xs.min()), int(xs.max())
                y1, y2 = int(ys.min()), int(ys.max())
                cv2.rectangle(mask, (x1, y1), (x2, y2), 255, thickness=-1)
            elif label.label_type == "polygon":
                if len(pts) >= 3:
                    cv2.fillPoly(mask, [pts], 255)

        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(out), mask)

    @staticmethod
    def save_semantic_mask(
        labels: list[LabelItem],
        image_width: int,
        image_height: int,
        output_path: str,
        multi_label: bool = True,
    ) -> None:
        """Save segmentation mask as PNG with semantic class encoding."""
        mask = np.zeros((image_height, image_width), dtype=np.uint8)

        for label in labels:
            # Set pixel value based on mode
            pixel_value = (label.class_id + 1) if multi_label else 255

            if label.label_type == "bbox":
                pts = np.array(label.points, dtype=np.int32)
                xs = pts[:, 0]
                ys = pts[:, 1]
                x1, x2 = int(xs.min()), int(xs.max())
                y1, y2 = int(ys.min()), int(ys.max())
                cv2.rectangle(mask, (x1, y1), (x2, y2), pixel_value, thickness=-1)
            elif label.label_type == "polygon":
                pts = np.array(label.points, dtype=np.int32)
                if len(pts) >= 3:
                    cv2.fillPoly(mask, [pts], pixel_value)
            elif label.label_type == "mask" and label.mask_data is not None:
                # Directly use the mask data
                mask_binary = (label.mask_data > 0).astype(np.uint8)
                mask[mask_binary > 0] = pixel_value

        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(out), mask)

    # ------------------------------------------------------------------
    # Batch save
    # ------------------------------------------------------------------

    @staticmethod
    def save_all_labels(
        label_manager: LabelManager,
        project_manager: ProjectManager,
    ) -> int:
        """Save labels for every image that has annotations."""
        count = 0
        for image_path in project_manager.image_list:
            labels = label_manager.get_labels(image_path)
            if not labels:
                continue

            # Read image dimensions.
            img = cv2.imread(image_path)
            if img is None:
                logger.warning("Could not read image: %s", image_path)
                continue

            h, w = img.shape[:2]
            label_path = project_manager.get_label_path(image_path)
            ExportManager.save_yolo_txt(labels, w, h, label_path)
            count += 1

        logger.info("Saved labels for %d images.", count)
        return count


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DEFAULT_COLORS: list[str] = [
    "#FF3838", "#FF9D97", "#FF701F", "#FFB21D", "#CFD231",
    "#48F90A", "#92CC17", "#3DDB86", "#1A9334", "#00D4BB",
    "#2C99A8", "#00C2FF", "#344593", "#6473FF", "#0018EC",
    "#8438FF", "#520085", "#CB38FF", "#FF95C8", "#FF37C7",
]


def _color_for_class(class_id: int) -> str:
    """Return a deterministic hex color for a class id."""
    return _DEFAULT_COLORS[class_id % len(_DEFAULT_COLORS)]
