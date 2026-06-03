import { memo } from "react";

function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="rk-page-header">
      <h1 className="rk-page-title">{title}</h1>
      <p className="rk-page-sub">{subtitle}</p>
    </header>
  );
}

export default memo(PageHeader);
