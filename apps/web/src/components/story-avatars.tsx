import Image from "next/image";
import { successStoryImages } from "@/lib/stories";

export function StoryAvatars({ sizeClass = "w-10 h-10" }: { sizeClass?: string }) {
  return (
    <div className="flex -space-x-3">
      {successStoryImages.map((s) => (
        <Image
          key={s.src}
          src={s.src!}
          alt=""
          width={96}
          height={96}
          sizes="48px"
          className={`${sizeClass} rounded-full object-cover border-2 border-white`}
          style={{ boxShadow: "0 4px 10px -4px rgba(18,32,67,0.3)" }}
        />
      ))}
    </div>
  );
}