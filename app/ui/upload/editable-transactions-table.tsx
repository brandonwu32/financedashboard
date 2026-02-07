"use client";

import { Transaction } from "@/app/lib/google-sheets";
import { useState } from "react";

interface EditableTransactionsTableProps {
  transactions: Transaction[];
  onTransactionsChange: (transactions: Transaction[]) => void;
}

export default function EditableTransactionsTable({
  transactions,
  onTransactionsChange,
}: EditableTransactionsTableProps) {
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    field: keyof Transaction;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleCellClick = (rowIndex: number, field: keyof Transaction) => {
    setEditingCell({ rowIndex, field });
    setEditValue(String(transactions[rowIndex][field] || ""));
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellBlur = () => {
    if (!editingCell) return;

    const { rowIndex, field } = editingCell;
    const updatedTransactions = [...transactions];
    const currentTransaction = updatedTransactions[rowIndex];

    // Type coercion for specific fields
    if (field === "amount") {
      const amount = parseFloat(editValue);
      if (!isNaN(amount)) {
        currentTransaction[field] = amount as never;
      }
    } else {
      currentTransaction[field] = editValue as never;
    }

    onTransactionsChange(updatedTransactions);
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleAddRow = () => {
    const newTransaction: Transaction = {
      date: new Date().toISOString().split("T")[0].replace(/-/g, "/"),
      description: "",
      amount: 0,
      category: "Discretionary",
      creditCard: "",
      status: "completed",
    };
    onTransactionsChange([...transactions, newTransaction]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const updatedTransactions = transactions.filter((_, idx) => idx !== rowIndex);
    onTransactionsChange(updatedTransactions);
  };

  const formatDateForInput = (dateStr: string) => {
    // Convert MM/DD/YYYY to YYYY-MM-DD for date input
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [mm, dd, yyyy] = parts;
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return dateStr;
  };

  const formatDateFromInput = (dateStr: string) => {
    // Convert YYYY-MM-DD to MM/DD/YYYY
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return `${mm}/${dd}/${yyyy}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full border border-gray-200 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-4 py-2 text-left font-medium text-gray-700 border w-20">
                Date
              </th>
              <th className="px-2 sm:px-4 py-2 text-left font-medium text-gray-700 border">
                Description
              </th>
              <th className="px-2 sm:px-4 py-2 text-right font-medium text-gray-700 border w-24">
                Amount
              </th>
              <th className="px-2 sm:px-4 py-2 text-left font-medium text-gray-700 border hidden sm:table-cell w-32">
                Category
              </th>
              <th className="px-2 sm:px-4 py-2 text-left font-medium text-gray-700 border hidden md:table-cell w-24">
                Card
              </th>
              <th className="px-2 sm:px-4 py-2 text-center font-medium text-gray-700 border w-12">
                Delete
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, idx) => (
              <tr key={idx} className="border hover:bg-gray-50">
                <td
                  className="px-2 sm:px-4 py-2 border cursor-pointer hover:bg-blue-50"
                  onClick={() => handleCellClick(idx, "date")}
                >
                  {editingCell?.rowIndex === idx && editingCell?.field === "date" ? (
                    <input
                      type="date"
                      value={formatDateForInput(editValue)}
                      onChange={(e) => setEditValue(formatDateFromInput(e.target.value))}
                      onBlur={handleCellBlur}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full px-1 py-1 border border-blue-500 rounded text-xs"
                    />
                  ) : (
                    <span className="text-gray-700">{transaction.date}</span>
                  )}
                </td>
                <td
                  className="px-2 sm:px-4 py-2 border cursor-pointer hover:bg-blue-50"
                  onClick={() => handleCellClick(idx, "description")}
                >
                  {editingCell?.rowIndex === idx && editingCell?.field === "description" ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={handleCellChange}
                      onBlur={handleCellBlur}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full px-1 py-1 border border-blue-500 rounded text-xs"
                      placeholder="Description"
                    />
                  ) : (
                    <span className="text-gray-700 truncate block">{transaction.description}</span>
                  )}
                </td>
                <td
                  className="px-2 sm:px-4 py-2 border text-right cursor-pointer hover:bg-blue-50 whitespace-nowrap"
                  onClick={() => handleCellClick(idx, "amount")}
                >
                  {editingCell?.rowIndex === idx && editingCell?.field === "amount" ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={handleCellChange}
                      onBlur={handleCellBlur}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full px-1 py-1 border border-blue-500 rounded text-xs text-right"
                      placeholder="0.00"
                    />
                  ) : (
                    <span className="text-gray-700">${Number(transaction.amount).toFixed(2)}</span>
                  )}
                </td>
                <td
                  className="px-2 sm:px-4 py-2 border cursor-pointer hover:bg-blue-50 hidden sm:table-cell text-xs sm:text-sm"
                  onClick={() => handleCellClick(idx, "category")}
                >
                  {editingCell?.rowIndex === idx && editingCell?.field === "category" ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={handleCellChange}
                      onBlur={handleCellBlur}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full px-1 py-1 border border-blue-500 rounded text-xs"
                      placeholder="Category"
                    />
                  ) : (
                    <span className="text-gray-700">{transaction.category}</span>
                  )}
                </td>
                <td
                  className="px-2 sm:px-4 py-2 border cursor-pointer hover:bg-blue-50 hidden md:table-cell text-xs sm:text-sm"
                  onClick={() => handleCellClick(idx, "creditCard")}
                >
                  {editingCell?.rowIndex === idx && editingCell?.field === "creditCard" ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={handleCellChange}
                      onBlur={handleCellBlur}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full px-1 py-1 border border-blue-500 rounded text-xs"
                      placeholder="Card"
                    />
                  ) : (
                    <span className="text-gray-700">{transaction.creditCard || "-"}</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-2 border text-center">
                  <button
                    onClick={() => handleDeleteRow(idx)}
                    className="text-red-600 hover:text-red-700 font-medium text-xs sm:text-sm"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAddRow}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition text-sm"
        >
          + Add Row
        </button>
        <span className="text-sm text-gray-600 flex items-center">
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
