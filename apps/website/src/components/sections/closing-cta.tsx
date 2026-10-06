import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";

export function ClosingCta() {
  return (
    <section className="closing-cta" aria-labelledby="closing-title">
      <div className="section-shell closing-cta-inner">
        <div>
          <p className="eyebrow eyebrow-light"><span aria-hidden="true" />Langkah berikutnya</p>
          <h2 id="closing-title" className="serif-heading">Bangun masa depan bersama Poltektrans SDP Palembang.</h2>
          <p>Kenali pendidikan vokasi transportasi perairan dan ikuti informasi penerimaan dari kanal resmi.</p>
        </div>
        <div className="closing-actions">
          <Link className="button button-accent" href="/pmb">Informasi PMB <ArrowRight size={16} aria-hidden="true" /></Link>
          <a className="button button-dark-outline" href="tel:+627117537264"><Phone size={16} aria-hidden="true" /> Hubungi institusi</a>
        </div>
      </div>
    </section>
  );
}
