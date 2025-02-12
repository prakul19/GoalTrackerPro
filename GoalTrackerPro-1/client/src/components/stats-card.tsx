import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  prefix?: string;
}

export default function StatsCard({
  title,
  value,
  description,
  prefix,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-2xl font-bold">
              {prefix}
              {value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}