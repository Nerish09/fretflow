type ProgressBarProps = {
  value: number;
  label?: string;
  showValue?: boolean;
};

export default function ProgressBar({
  value,
  label,
  showValue = true,
}: ProgressBarProps) {
  const normalized =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(value)
      )
    );

  return (
    <div className="ff-progress">
      {(label ||
        showValue) && (
        <div className="ff-progress-header">
          <span>
            {label || ""}
          </span>

          {showValue && (
            <strong>
              {normalized}%
            </strong>
          )}
        </div>
      )}

      <div className="ff-progress-track">
        <span
          style={{
            width: `${normalized}%`,
          }}
        />
      </div>
    </div>
  );
}