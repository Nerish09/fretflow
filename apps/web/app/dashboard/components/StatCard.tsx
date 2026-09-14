type StatCardProps = {
  label: string;
  value: string | number;
  suffix?: string;
  detail?: string;
  accent?: boolean;
};

export default function StatCard({
  label,
  value,
  suffix,
  detail,
  accent = false,
}: StatCardProps) {
  return (
    <article
      className={
        accent
          ? "ff-stat-card ff-stat-card-accent"
          : "ff-stat-card"
      }
    >
      <span className="ff-stat-label">
        {label}
      </span>

      <div className="ff-stat-value">
        <strong>
          {value}
        </strong>

        {suffix && (
          <span>
            {suffix}
          </span>
        )}
      </div>

      {detail && (
        <p>
          {detail}
        </p>
      )}
    </article>
  );
}