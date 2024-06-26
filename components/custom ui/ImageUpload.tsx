import { CldUploadWidget } from "next-cloudinary";
import { Plus, Trash } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { useState } from "react";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onChange,
  onRemove,
  value,
}) => {
  const [removing, setRemoving] = useState<string | null>(null);
  const onUpload = (result: any) => {
    onChange(result.info.secure_url);
    setRemoving(null);
  };

  const handleRemove = (url: string) => {
    setRemoving(url);
    setTimeout(() => onRemove(url), 500);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {value.map((url) => (
          <div
            key={url}
            className={`relative w-[200px] h-[200px] transition-all duration-500 overflow-hidden ${
              removing === url ? "opacity-0 h-0" : ""
            }`}
          >
            <div className="absolute top-0 right-0 z-10">
              <Button
                type="button"
                onClick={() => handleRemove(url)}
                size="sm"
                className="bg-red-1 text-white"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <Image
              src={url}
              alt="collection"
              className="object-cover rounded-lg"
              fill
            />
          </div>
        ))}
      </div>

      <CldUploadWidget uploadPreset="gzlrjc1y" onUpload={onUpload}>
        {({ open }) => {
          return (
            <Button
              type="button"
              onClick={() => open()}
              className="bg-grey-1 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
};

export default ImageUpload;