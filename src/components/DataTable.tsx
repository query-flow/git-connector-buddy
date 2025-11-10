import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps {
  columns: string[];
  rows: any[][];
}

export const DataTable = ({ columns, rows }: DataTableProps) => {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={index} className="font-semibold bg-muted/50">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>
                    {cell === null || cell === undefined ? (
                      <span className="text-muted-foreground italic">null</span>
                    ) : (
                      String(cell)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t border-border">
        {rows.length} row{rows.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};