"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dark, docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type Model = {
  name: string;
  fields: { name: string; type: string }[];
};

type Relation = {
  fromModel: string;
  toModel: string;
  type: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
};

export function SchemaGenerator() {
  const [models, setModels] = useState<Model[]>([]);
  const [currentModel, setCurrentModel] = useState<Model>({
    name: "",
    fields: [],
  });
  const [relations, setRelations] = useState<Relation[]>([]);
  const [generatedSchema, setGeneratedSchema] = useState("");
  const [generatedModels, setGeneratedModels] = useState("");

  const handleAddField = () => {
    setCurrentModel({
      ...currentModel,
      fields: [...currentModel.fields, { name: "", type: "String" }],
    });
  };

  const handleAddModel = () => {
    if (currentModel.name && currentModel.fields.length > 0) {
      setModels([...models, currentModel]);
      setCurrentModel({ name: "", fields: [] });
    }
  };

  const handleAddRelation = () => {
    if (models.length >= 2) {
      setRelations([
        ...relations,
        {
          fromModel: models[0].name,
          toModel: models[1].name,
          type: "oneToOne",
        },
      ]);
    }
  };

  const generatePrismaSchema = () => {
    let schema = "";

    models.forEach((model) => {
      schema += `model ${model.name} {\n`;
      schema += `  id Int @id @default(autoincrement())\n`;

      model.fields.forEach((field) => {
        schema += `  ${field.name} ${field.type}\n`;
      });

      const modelRelations = relations.filter(
        (r) => r.fromModel === model.name || r.toModel === model.name
      );

      modelRelations.forEach((relation) => {
        if (relation.fromModel === model.name) {
          const relatedModel = models.find((m) => m.name === relation.toModel);
          if (relatedModel) {
            if (relation.type === "oneToOne") {
              schema += `  ${relatedModel.name.toLowerCase()} ${
                relatedModel.name
              }?\n`;
            } else if (
              relation.type === "oneToMany" ||
              relation.type === "manyToMany"
            ) {
              schema += `  ${relatedModel.name.toLowerCase()}s ${
                relatedModel.name
              }[]\n`;
            }
          }
        } else if (relation.toModel === model.name) {
          const relatedModel = models.find(
            (m) => m.name === relation.fromModel
          );
          if (relatedModel) {
            schema += `  ${relatedModel.name.toLowerCase()} ${
              relatedModel.name
            } @relation(fields: [${relatedModel.name.toLowerCase()}Id], references: [id])\n`;

            schema += `  ${relatedModel.name.toLowerCase()}Id Int\n`;
          }
        }
      });

      schema += `  createdAt DateTime @default(now())\n`;
      schema += `  updatedAt DateTime @updatedAt\n`;

      schema += `\n  @@map("${model.name.toLowerCase()}s")\n`;
      schema += "}\n\n";
    });

    return schema;
  };

  const generateStaticFromMethods = () => {
    let methodsCode = "";

    models.forEach((model) => {
      const className =
        model.name.charAt(0).toUpperCase() + model.name.slice(1);

      methodsCode += `static from({\n  id,\n  ${model.fields
        .map((f) => f.name)
        .join(",\n  ")},\n`;

      const modelRelations = relations.filter(
        (r) => r.fromModel === model.name || r.toModel === model.name
      );

      modelRelations.forEach((relation) => {
        const relatedModel =
          relation.fromModel === model.name
            ? relation.toModel
            : relation.fromModel;

        if (
          relation.type === "oneToOne" ||
          relation.type === "manyToOne" ||
          (relation.type === "oneToMany" && relation.toModel === model.name)
        ) {
          methodsCode += `    ${relatedModel.toLowerCase()}Id,\n`;
        }
      });

      methodsCode += `}: ${className}Prisma) {\n`;

      methodsCode += `  return new ${className}({\n`;

      methodsCode += `    id: id,\n`;
      model.fields.forEach((field) => {
        if (field.name === "role") {
          methodsCode += `    ${field.name}: ${field.name} as Role,\n`;
        } else {
          methodsCode += `    ${field.name}: ${field.name},\n`;
        }
      });

      modelRelations.forEach((relation) => {
        const relatedModel =
          relation.fromModel === model.name
            ? relation.toModel
            : relation.fromModel;

        if (
          relation.type === "oneToOne" ||
          relation.type === "manyToOne" ||
          (relation.type === "oneToMany" && relation.toModel === model.name)
        ) {
          methodsCode += `    ${relatedModel.toLowerCase()}Id: ${relatedModel.toLowerCase()}Id,\n`;
        }
      });

      methodsCode += `  });\n`;
      methodsCode += `}\n\n`;
    });

    return methodsCode;
  };

  const handleGenerate = () => {
    const schema = generatePrismaSchema();
    const modelCode = generateStaticFromMethods();
    setGeneratedSchema(schema);
    setGeneratedModels(modelCode);
  };

  const handleDeleteField = (modelIndex: number, fieldIndex: number) => {
    const newModels = [...models];
    newModels[modelIndex].fields.splice(fieldIndex, 1);
    setModels(newModels);
  };

  const handleDeleteModel = (modelIndex: number) => {
    const newModels = [...models];
    newModels.splice(modelIndex, 1);
    setModels(newModels);
    setRelations(
      relations.filter(
        (relation) =>
          relation.fromModel !== models[modelIndex].name &&
          relation.toModel !== models[modelIndex].name
      )
    );
  };

  const handleDeleteRelation = (relationIndex: number) => {
    const newRelations = [...relations];
    newRelations.splice(relationIndex, 1);
    setRelations(newRelations);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="modelName">Model Name</Label>
            <Input
              id="modelName"
              value={currentModel.name}
              onChange={(e) =>
                setCurrentModel({ ...currentModel, name: e.target.value })
              }
              placeholder="Enter model name"
            />
          </div>
          <div className="space-y-2">
            <Label>Fields</Label>
            {currentModel.fields.map((field, fieldIndex) => (
              <div key={fieldIndex} className="flex space-x-2">
                <Input
                  value={field.name}
                  onChange={(e) => {
                    const newFields = [...currentModel.fields];
                    newFields[fieldIndex].name = e.target.value;
                    setCurrentModel({ ...currentModel, fields: newFields });
                  }}
                  placeholder="Field name"
                />
                <Select
                  value={field.type}
                  onValueChange={(value) => {
                    const newFields = [...currentModel.fields];
                    newFields[fieldIndex].type = value;
                    setCurrentModel({ ...currentModel, fields: newFields });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="String">String</SelectItem>
                    <SelectItem value="Int">Int</SelectItem>
                    <SelectItem value="Boolean">Boolean</SelectItem>
                    <SelectItem value="DateTime">DateTime</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteField(0, fieldIndex)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <Button onClick={handleAddField}>Add Field</Button>
            <Button onClick={handleAddModel}>Add Model</Button>
          </div>
          <div className="space-y-2">
            {models.length > 0 && (
              <>
                <Label>Existing Models</Label>
                {models.map((model, modelIndex) => (
                  <div key={modelIndex} className="flex items-center space-x-2">
                    <span>{model.name}</span>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteModel(modelIndex)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {models.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Relation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {relations.map((relation, index) => (
              <div key={index} className="flex space-x-2">
                <Select
                  value={relation.fromModel}
                  onValueChange={(value) => {
                    const newRelations = [...relations];
                    newRelations[index].fromModel = value;
                    setRelations(newRelations);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="From Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={relation.type}
                  onValueChange={(value) => {
                    const newRelations = [...relations];
                    newRelations[index].type = value as
                      | "oneToOne"
                      | "oneToMany"
                      | "manyToMany";
                    setRelations(newRelations);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Relation Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oneToOne">One-to-One</SelectItem>
                    <SelectItem value="oneToMany">One-to-Many</SelectItem>
                    <SelectItem value="manyToMany">Many-to-Many</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={relation.toModel}
                  onValueChange={(value) => {
                    const newRelations = [...relations];
                    newRelations[index].toModel = value;
                    setRelations(newRelations);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="To Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteRelation(index)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </Button>
              </div>
            ))}
            <Button onClick={handleAddRelation}>Add Relation</Button>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleGenerate}>Generate Schema and Models</Button>

      <Tabs defaultValue="schema" className="w-full">
        <TabsList>
          <TabsTrigger value="schema">Prisma Schema</TabsTrigger>
          <TabsTrigger value="models">TypeScript Models</TabsTrigger>
        </TabsList>
        <TabsContent value="schema">
          <SyntaxHighlighter
            language="prisma"
            style={materialDark}
            className="h-[400px] p-4 rounded-md bg-gray-900 text-white overflow-auto"
          >
            {generatedSchema}
          </SyntaxHighlighter>
        </TabsContent>
        <TabsContent value="models">
          <SyntaxHighlighter
            language="typescript"
            style={materialDark}
            className="h-[400px] p-4 rounded-md bg-gray-900 text-white overflow-auto"
          >
            {generatedModels}
          </SyntaxHighlighter>
        </TabsContent>
      </Tabs>
    </div>
  );
}
