type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
  centered?: boolean;
  headingId?: string;
};

export function SectionHeading({ eyebrow, title, description, light = false, centered = false, headingId }: SectionHeadingProps) {
  return (
    <div className={`section-heading${light ? " section-heading-light" : ""}${centered ? " section-heading-centered" : ""}`}>
      <p className="eyebrow"><span aria-hidden="true" />{eyebrow}</p>
      <h2 className="serif-heading" id={headingId}>{title}</h2>
      {description ? <p className="section-heading-copy">{description}</p> : null}
    </div>
  );
}
