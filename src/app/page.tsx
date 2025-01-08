import { SchemaGenerator } from "../components/schema-generator";

export default function Home() {
  return (
    <div className="space-y-8 w-1/2 mx-auto">
      <h2 className="text-3xl font-bold">Generate Your Prisma Schema</h2>
      <SchemaGenerator />
    </div>
  );
}
