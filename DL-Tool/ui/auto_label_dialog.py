"""Auto labeling dialog for batch inference."""

import time
from collections import deque

from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QFormLayout,
    QLabel, QDoubleSpinBox, QSpinBox, QRadioButton,
    QPushButton, QProgressBar, QButtonGroup, QGroupBox,
    QMessageBox, QWidget,
)
from PySide6.QtCore import Signal, Slot, Qt

from i18n import tr
from core.auto_labeler import AutoLabelWorker
from core.model_manager import DEFAULT_INFER_SIZE

# Rolling-window size for speed estimation (number of recent steps to average).
_SPEED_WINDOW = 8


def _fmt_seconds(secs: float) -> str:
    """Format a duration in seconds to a human-readable string.

    Examples:
        0  → "0s"
        45 → "45s"
        90 → "1m 30s"
    """
    secs = max(0, int(secs))
    if secs < 60:
        return f"{secs}s"
    m, s = divmod(secs, 60)
    return f"{m}m {s:02d}s"


class AutoLabelDialog(QDialog):
    labels_generated = Signal(str, list)  # image_path, list[LabelItem]

    def __init__(self, model_manager, image_paths: list[str],
                 current_index: int = 0, parent: QWidget = None):
        super().__init__(parent)
        self._model_manager = model_manager
        self._image_paths = image_paths
        self._current_index = current_index
        self._worker = None

        # Timing state (reset on each run)
        self._start_time: float = 0.0
        self._step_times: deque = deque(maxlen=_SPEED_WINDOW)

        self._setup_ui()

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _setup_ui(self):
        self.setWindowTitle(tr("auto_label_title"))
        self.setMinimumWidth(440)
        layout = QVBoxLayout(self)

        # ── Parameter form ─────────────────────────────────────────────
        form = QFormLayout()

        self._model_label = QLabel(
            self._model_manager.get_model_type()
            if self._model_manager.is_loaded
            else tr("auto_label_no_model")
        )
        form.addRow(tr("auto_label_model"), self._model_label)

        # Confidence threshold – forwarded to the model (NMS floor).
        self._confidence_spin = QDoubleSpinBox()
        self._confidence_spin.setRange(0.01, 1.0)
        self._confidence_spin.setSingleStep(0.05)
        self._confidence_spin.setValue(0.25)
        self._confidence_spin.setDecimals(2)
        self._confidence_spin.setToolTip(tr("auto_label_confidence_tooltip"))
        form.addRow(tr("auto_label_confidence"), self._confidence_spin)

        # Score threshold – post-processing filter.
        self._score_spin = QDoubleSpinBox()
        self._score_spin.setRange(0.01, 1.0)
        self._score_spin.setSingleStep(0.05)
        self._score_spin.setValue(0.50)
        self._score_spin.setDecimals(2)
        self._score_spin.setToolTip(tr("auto_label_score_threshold_tooltip"))
        form.addRow(tr("auto_label_score_threshold"), self._score_spin)

        # Inference image size.
        self._infer_size_spin = QSpinBox()
        self._infer_size_spin.setRange(32, 1280)
        self._infer_size_spin.setSingleStep(32)
        self._infer_size_spin.setValue(DEFAULT_INFER_SIZE)
        self._infer_size_spin.setToolTip(tr("auto_label_infer_size_tooltip"))
        form.addRow(tr("auto_label_infer_size"), self._infer_size_spin)

        layout.addLayout(form)

        # ── Scope selection ────────────────────────────────────────────
        scope_group = QGroupBox(tr("auto_label_scope"))
        scope_layout = QVBoxLayout(scope_group)
        self._scope_btn_group = QButtonGroup(self)

        self._current_radio = QRadioButton(tr("auto_label_current"))
        self._current_radio.setChecked(True)
        self._scope_btn_group.addButton(self._current_radio, 0)
        scope_layout.addWidget(self._current_radio)

        self._all_radio = QRadioButton(tr("auto_label_all"))
        self._scope_btn_group.addButton(self._all_radio, 1)
        scope_layout.addWidget(self._all_radio)

        layout.addWidget(scope_group)

        # ── Progress bar (shows % in the bar itself) ───────────────────
        self._progress_bar = QProgressBar()
        self._progress_bar.setVisible(False)
        self._progress_bar.setFormat("%p%")          # "30%" inside bar
        self._progress_bar.setAlignment(Qt.AlignCenter)
        self._progress_bar.setMinimumHeight(22)
        layout.addWidget(self._progress_bar)

        # ── Status labels ──────────────────────────────────────────────
        # Line 1: "3 / 10 (30%)"
        self._status_label = QLabel("")
        self._status_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self._status_label)

        # Line 2: "속도: 1.2 img/s  |  남은 시간: 5s  |  경과: 3s"
        self._time_label = QLabel("")
        self._time_label.setAlignment(Qt.AlignCenter)
        self._time_label.setStyleSheet("color: #888888; font-size: 11px;")
        layout.addWidget(self._time_label)

        # ── Buttons ────────────────────────────────────────────────────
        btn_layout = QHBoxLayout()
        self._start_btn = QPushButton(tr("auto_label_start"))
        self._start_btn.clicked.connect(self._on_start)
        btn_layout.addWidget(self._start_btn)

        self._cancel_btn = QPushButton(tr("auto_label_cancel"))
        self._cancel_btn.clicked.connect(self._on_cancel)
        btn_layout.addWidget(self._cancel_btn)

        layout.addLayout(btn_layout)

    # ------------------------------------------------------------------
    # Slots
    # ------------------------------------------------------------------

    def _on_start(self):
        if not self._model_manager.is_loaded:
            QMessageBox.warning(self, tr("warning"), tr("auto_label_no_model"))
            return

        # Determine which images to process.
        if self._scope_btn_group.checkedId() == 0:
            paths = [self._image_paths[self._current_index]]
        else:
            paths = self._image_paths

        confidence = self._confidence_spin.value()
        score_threshold = self._score_spin.value()
        infer_size = self._infer_size_spin.value()

        # Reset timing state.
        self._start_time = time.monotonic()
        self._step_times.clear()

        self._progress_bar.setVisible(True)
        self._progress_bar.setMaximum(len(paths))
        self._progress_bar.setValue(0)
        self._status_label.setText("")
        self._time_label.setText("")
        self._start_btn.setEnabled(False)

        self._worker = AutoLabelWorker(
            self._model_manager,
            paths,
            confidence=confidence,
            score_threshold=score_threshold,
            infer_size=infer_size,
        )
        self._worker.progress.connect(self._on_progress)
        self._worker.image_done.connect(self._on_image_done)
        self._worker.finished_all.connect(self._on_finished)
        self._worker.error.connect(self._on_error)
        self._worker.start()

    @Slot(int, int)
    def _on_progress(self, current: int, total: int):
        now = time.monotonic()
        self._step_times.append(now)

        # Update progress bar value (format string already shows %).
        self._progress_bar.setValue(current)

        # ── Percentage ────────────────────────────────────────────────
        pct = int(current / total * 100) if total else 0
        self._status_label.setText(
            tr("auto_label_progress_pct").format(
                current=current, total=total, pct=pct
            )
        )

        # ── Speed & ETA ───────────────────────────────────────────────
        elapsed = now - self._start_time

        # Rolling-window speed: use the last _SPEED_WINDOW completions so
        # the estimate reacts quickly to slow/fast images without being
        # dominated by a single outlier.
        if len(self._step_times) >= 2:
            window_elapsed = self._step_times[-1] - self._step_times[0]
            window_count   = len(self._step_times) - 1
            speed = window_count / window_elapsed if window_elapsed > 0 else 0.0
        elif elapsed > 0:
            speed = current / elapsed
        else:
            speed = 0.0

        remaining = total - current
        eta_sec   = remaining / speed if speed > 0 else 0.0

        self._time_label.setText(
            tr("auto_label_time_info").format(
                speed=f"{speed:.1f}",
                eta=_fmt_seconds(eta_sec),
                elapsed=_fmt_seconds(elapsed),
            )
        )

    @Slot(str, list)
    def _on_image_done(self, image_path: str, labels: list):
        self.labels_generated.emit(image_path, labels)

    @Slot()
    def _on_finished(self):
        elapsed = time.monotonic() - self._start_time
        self._start_btn.setEnabled(True)
        self._status_label.setText(tr("auto_label_complete").format(count=""))
        self._time_label.setText(
            tr("auto_label_elapsed").format(elapsed=_fmt_seconds(elapsed))
        )
        self._worker = None

    @Slot(str)
    def _on_error(self, msg: str):
        self._start_btn.setEnabled(True)
        self._time_label.setText("")
        QMessageBox.critical(self, tr("error"), msg)
        self._worker = None

    def _on_cancel(self):
        if self._worker and self._worker.isRunning():
            self._worker.abort()
            self._worker.wait(3000)
            self._worker = None
        self.reject()

    def closeEvent(self, event):
        if self._worker and self._worker.isRunning():
            self._worker.abort()
            self._worker.wait(3000)
        super().closeEvent(event)
