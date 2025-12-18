export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition_type: "chapters" | "points";
  condition_value: number;
};
