import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Tag } from "@/lib/types";

export const useTags = (userId: string | null) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tags from database
  const fetchTags = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Create a new tag
  const createTag = useCallback(
    async (tagName: string): Promise<Tag | null> => {
      if (!userId) return null;

      const colors = [
        "#EF4444",
        "#F97316",
        "#F59E0B",
        "#EAB308",
        "#84CC16",
        "#22C55E",
        "#10B981",
        "#14B8A6",
        "#06B6D4",
        "#0EA5E9",
        "#3B82F6",
        "#6366F1",
        "#8B5CF6",
        "#A855F7",
        "#D946EF",
        "#EC4899",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      try {
        const { data, error } = await supabase
          .from("tags")
          .insert({
            user_id: userId,
            name: tagName,
            color: randomColor,
          })
          .select()
          .single();

        if (error) throw error;

        // Update tags list
        setTags((prev) => [...prev, data]);
        return data;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to create tag"
        );
        return null;
      }
    },
    [userId]
  );

  // Filter tags based on search term
  const filterTags = useCallback(
    (searchTerm: string, excludeIds: string[] = []) => {
      return tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !excludeIds.includes(tag.id)
      );
    },
    [tags]
  );

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    filterTags,
    refetch: fetchTags,
  };
};
