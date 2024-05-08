"use client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import React, { useState } from "react";
import { X } from "lucide-react";

// Interface
interface MultiTextProps {
  placeholder: string;
  value: string[];
  onChange: (value: string) => void;
  onRemove: (index: string) => void;
}
const MultiText: React.FC<MultiTextProps> = ({
  placeholder,
  value,
  onChange,
  onRemove,
}) => {
  const [inputValue, setInputValue] = useState("");
  // Add value to the list
  const addValue = (item: string) => {
    onChange(item);
    setInputValue("");
  };
  return (
    <>
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addValue(inputValue);
          }
        }}
      />

      <div className="flex gap-1 flex-wrap mt-4">
        {value.map((item, index) => (
          <Badge key={index} className="bg-grey-1 text-white">
            {item}
            <button
              className="ml-1 rounded-full outline-none hover:bg-red-1"
              onClick={() => onRemove(item)}
            >
              <X className="h-4 w-4" />
            </button>
          </Badge>
        ))}
      </div>
    </>
  );
};

export default MultiText;
