import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

export function TimetableSkeleton() {
  const columns = 6;
  const rows = 7;

  return (
    <Card className="shadow-lg border-none">
      <CardContent className="p-0">
        <div className="overflow-x-auto rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {Array.from({ length: columns }).map((_, i) => (
                  <TableHead key={i}><Skeleton className="h-6 w-24 bg-gray-300" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columns }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-6 w-full bg-gray-200" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
