import { useState } from "react";
import SupplierMaterialMapping from "./SupplierMaterialMapping";
import SupplierMaterialListPage from "./SupplierMaterialListPage";
import MaterialSupplierListPage from "./MaterialSupplierListPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

export default function SupplierMaterials() {
  return (
    <Tabs defaultValue="assign" className="space-y-4">
      <TabsList>
        <TabsTrigger value="assign">Assign Suppliers</TabsTrigger>
        <TabsTrigger value="by-supplier">By Supplier</TabsTrigger>
        <TabsTrigger value="by-material">By Material</TabsTrigger>
      </TabsList>
      <TabsContent value="assign">
        <SupplierMaterialMapping />
      </TabsContent>
      <TabsContent value="by-supplier">
        <SupplierMaterialListPage />
      </TabsContent>
      <TabsContent value="by-material">
        <MaterialSupplierListPage />
      </TabsContent>
    </Tabs>
  );
}