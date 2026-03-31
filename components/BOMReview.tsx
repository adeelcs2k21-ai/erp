import React, { useState } from "react";
import {
  Card,
  Title,
  Text,
  Group,
  Table,
  Badge,
  Textarea,
  Button,
  Divider,
  SimpleGrid,
} from "@mantine/core";

type Item = {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
};

type Supplier = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

interface BOMReviewProps {
  bomNumber: string;
  createdBy: string;
  totalAmount: string;
  items: Item[];
  suppliers: Supplier[];
}

export default function BOMReview({
  bomNumber,
  createdBy,
  totalAmount,
  items,
  suppliers,
}: BOMReviewProps) {
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState<null | "approved" | "rejected">(null);

  function handleApprove() {
    setStatus("approved");
  }

  function handleReject() {
    if (!remark) {
      alert("Please provide a remark when rejecting.");
      return;
    }
    setStatus("rejected");
  }

  const statusBadge = status ? (
    <Badge color={status === "approved" ? "green" : "red"} size="lg" variant="filled">
      {status.toUpperCase()}
    </Badge>
  ) : (
    <Badge color="yellow" size="lg" variant="filled">
      PENDING
    </Badge>
  );

  return (
    <Card p="lg" radius="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Review Bill of Material</Title>
          <Text c="dimmed" size="sm" mt="xs">
            BOM Number: <strong>{bomNumber}</strong>
          </Text>
          <Text c="dimmed" size="sm">
            Created By: <strong>{createdBy}</strong>
          </Text>
        </div>
        <Group align="center">
          {statusBadge}
        </Group>
      </Group>

      <Divider my="xl" />

      <Title order={4} mb="md">Items</Title>
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Item</Table.Th>
            <Table.Th>Qty</Table.Th>
            <Table.Th>Unit Price</Table.Th>
            <Table.Th>Total</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((it, idx) => (
            <Table.Tr key={idx}>
              <Table.Td>{it.name}</Table.Td>
              <Table.Td>{it.qty}</Table.Td>
              <Table.Td>PKR {it.unitPrice.toFixed(2)}</Table.Td>
              <Table.Td>PKR {it.total.toFixed(2)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Divider my="xl" />

      <Title order={4} mb="md">Suppliers</Title>
      <SimpleGrid cols={1} spacing="md">
        {suppliers.map((s, i) => (
          <Card key={i} withBorder p="sm" radius="sm">
            <Text fw={500}>{s.name}</Text>
            <Text size="sm" c="dimmed">
              {s.email} • {s.phone}
            </Text>
            <Text size="sm" c="dimmed">
              {s.address}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <Divider my="xl" />

      <Title order={4} mb="md">Actions</Title>
      <Textarea
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        placeholder="Add remarks if rejecting..."
        label="Rejection Remarks (if rejecting)"
        autosize
        minRows={3}
        mb="md"
      />

      <Group>
        <Button color="green" onClick={handleApprove} disabled={!!status}>
          Approve
        </Button>
        <Button color="red" onClick={handleReject} disabled={!!status}>
          Reject
        </Button>
      </Group>

      {status && (
        <Text c={status === 'approved' ? 'green' : 'red'} mt="sm">
          {status === 'approved' ? 'Approved' : `Rejected: ${remark}`}
        </Text>
      )}
    </Card>
  );
}
