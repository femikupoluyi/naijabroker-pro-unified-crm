
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DebitCreditNotes } from "./DebitCreditNotes";
import { ReceiptProcessing } from "./ReceiptProcessing";
import { RemittanceManagement } from "./RemittanceManagement";

export const FinancialManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const debitNotes = [
    {
      id: "DN-2024-001",
      policyNumber: "POL-2024-001234",
      client: "Dangote Industries Ltd",
      grossPremium: "₦2,500,000",
      vat: "₦375,000",
      netPremium: "₦2,875,000",
      status: "outstanding",
      dueDate: "2024-07-15"
    },
    {
      id: "DN-2024-002",
      policyNumber: "POL-2024-001235",
      client: "GTBank Plc",
      grossPremium: "₦5,000,000",
      vat: "₦750,000",
      netPremium: "₦5,750,000",
      status: "paid",
      dueDate: "2024-06-20"
    },
  ];

  const receipts = [
    {
      id: "RCP-2024-001",
      debitNoteId: "DN-2024-002",
      client: "GTBank Plc",
      amount: "₦5,750,000",
      paymentMethod: "Bank Transfer",
      receiptDate: "2024-06-18",
      status: "cleared"
    },
  ];

  const commissions = [
    {
      id: "COM-2024-001",
      policyNumber: "POL-2024-001235",
      underwriter: "AXA Mansard",
      premium: "₦5,000,000",
      commissionRate: "10%",
      commissionAmount: "₦500,000",
      status: "paid",
      paymentDate: "2024-06-25"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline">Generate Report</Button>
          <Button>Process Payment</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">₦25.5M</div>
            <p className="text-xs text-muted-foreground">Outstanding Premiums</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">₦45.2M</div>
            <p className="text-xs text-muted-foreground">Collected This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">₦4.5M</div>
            <p className="text-xs text-muted-foreground">Commission Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">₦40.7M</div>
            <p className="text-xs text-muted-foreground">Remitted to Underwriters</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="debit-notes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="debit-notes">Debit & Credit Notes</TabsTrigger>
          <TabsTrigger value="receipts">Receipt Processing</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="remittances">Remittances</TabsTrigger>
        </TabsList>

        <TabsContent value="debit-notes">
          <DebitCreditNotes />
        </TabsContent>

        <TabsContent value="receipts">
          <ReceiptProcessing />
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Commission Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commission ID</TableHead>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Underwriter</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">{commission.id}</TableCell>
                      <TableCell>{commission.policyNumber}</TableCell>
                      <TableCell>{commission.underwriter}</TableCell>
                      <TableCell>{commission.premium}</TableCell>
                      <TableCell>{commission.commissionRate}</TableCell>
                      <TableCell className="font-semibold text-green-600">{commission.commissionAmount}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">{commission.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remittances">
          <RemittanceManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
