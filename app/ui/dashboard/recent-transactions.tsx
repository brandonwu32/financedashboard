import { Transaction } from "@/app/lib/google-sheets";

export default function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const recent = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      "Grocery": "bg-green-100 text-green-800",
      "Discretionary": "bg-orange-100 text-orange-800",
      "Restaurant": "bg-blue-100 text-blue-800",
      "Other": "bg-gray-100 text-gray-800",
    };
    
    return categoryColors[category] || categoryColors["Other"];
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
        Recent Transactions
      </h2>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">
                Date
              </th>
              <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700">
                Description
              </th>
              <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700 hidden sm:table-cell">
                Category
              </th>
              <th className="px-3 sm:px-4 py-2 text-left font-medium text-gray-700 hidden md:table-cell">
                Card
              </th>
              <th className="px-3 sm:px-4 py-2 text-right font-medium text-gray-700">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recent.map((transaction, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition">
                <td className="px-3 sm:px-4 py-2 text-gray-600 whitespace-nowrap">
                  {transaction.date ? (() => {
                    // Handle both MM/DD/YYYY and YYYY-MM-DD formats
                    let dateObj: Date;
                    if (transaction.date.includes("/")) {
                      // MM/DD/YYYY format
                      const [mm, dd, yyyy] = transaction.date.split("/");
                      dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
                    } else {
                      // YYYY-MM-DD format
                      const [year, month, day] = transaction.date.split("-");
                      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    }
                    return dateObj.toLocaleDateString();
                  })() : ""}
                </td>
                <td className="px-3 sm:px-4 py-2 text-gray-900 max-w-xs truncate">
                  {transaction.description}
                </td>
                <td className="px-3 sm:px-4 py-2 hidden sm:table-cell">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(transaction.category)}`}
                  >
                    {transaction.category}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2 text-gray-600 hidden md:table-cell">
                  {transaction.creditCard}
                </td>
                <td className="px-3 sm:px-4 py-2 text-right font-medium text-gray-900 whitespace-nowrap">
                  ${transaction.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recent.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm sm:text-base">No transactions yet</p>
        </div>
      )}
    </div>
  );
}
