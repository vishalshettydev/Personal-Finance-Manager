"use client";

import { Tag } from "@/types/transaction";

interface TransactionTagsProps {
  tags: Tag[];
  size?: "sm" | "md";
  maxVisible?: number;
}

export const TransactionTags = ({
  tags,
  size = "sm",
  maxVisible = 3,
}: TransactionTagsProps) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {visibleTags.map((tag) => {
        const tagColor = tag.color || "#3B82F6"; // Default to blue if no color
        return (
          <span
            key={tag.id}
            className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
            style={{
              backgroundColor: tagColor + "20", // Add transparency
              color: tagColor,
              borderColor: tagColor + "40",
              border: "1px solid",
            }}
          >
            {tag.name}
          </span>
        );
      })}
      {hiddenCount > 0 && (
        <span
          className={`inline-flex items-center rounded-full bg-gray-100 text-gray-600 font-medium ${sizeClasses[size]}`}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};
