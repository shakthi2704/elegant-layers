import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ToggleActiveMenuItem } from "@/components/users/toggle-active-menu-item";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export default async function UsersPage() {
  const currentUser = await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6 px-6 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Admin and cashier accounts for this shop.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/users/new" />}
        >
          Add User
        </Button>
      </div>

      <div className="overflow-hidden rounded-md">
        <Table className="w-full text-sm  border border-border ">
          <TableHeader className="bg-muted ">
            <TableRow>
              <TableHead className="px-4 py-2.5 font-medium">
                Name
              </TableHead>

              <TableHead className="px-4 py-2.5 font-medium">
                Email
              </TableHead>

              <TableHead className="px-4 py-2.5 font-medium">
                Role
              </TableHead>

              <TableHead className="px-4 py-2.5 font-medium">
                Status
              </TableHead>

              <TableHead className="px-4 py-2.5 text-right font-medium">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border bg-muted/20">
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.name}{" "}
                  {u.id === currentUser.id && (
                    <span className="text-xs text-primary">
                      (you)
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-foreground">
                  {u.email}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      u.role === "ADMIN" ? "default" : "secondary"
                    }
                  >
                    {u.role}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={u.isActive ? "link" : "secondary"}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">Open menu</span>
                    </DropdownMenuTrigger>


                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        nativeButton={false}
                        render={
                          <Link href={`/users/${u.id}/edit`} />
                        }
                      >
                        Edit
                      </DropdownMenuItem>

                      {u.id !== currentUser.id && (
                        <ToggleActiveMenuItem
                          userId={u.id}
                          isActive={u.isActive}
                        />
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
