import React from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="ff-page-header">
      <div className="ff-page-header-copy">
        {eyebrow && (
          <p className="ff-eyebrow">
            {eyebrow}
          </p>
        )}

        <h1>
          {title}
        </h1>

        {description && (
          <p className="ff-page-description">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="ff-page-actions">
          {actions}
        </div>
      )}
    </header>
  );
}