import Image from "next/image";

type PictureFrameProps = {
  src: string;
  alt: string;
  eyebrow?: string;
  title?: string;
};

export function PictureFrame({ src, alt, eyebrow, title }: PictureFrameProps) {
  return (
    <div className="picture-card patriotic-band rounded-[2rem]">
      <div className="relative aspect-[4/3]">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#122544]/40 to-transparent" />
      </div>
      {(eyebrow || title) && (
        <div className="border-t border-[#163c6e] bg-[#122544] px-5 py-4 text-white">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <p className="mt-2 text-lg font-semibold text-white">{title}</p> : null}
        </div>
      )}
    </div>
  );
}
