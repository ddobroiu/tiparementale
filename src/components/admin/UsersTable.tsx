"use client";

import Link from "next/link";
import { Fragment, useState } from "react";

import { CreditForm } from "./CreditForm";

export interface UserListRow {
  id: string;
  email: string;
  created: string;
  active: string;
  sessions: number;
  transformations: number;
  nodes: number;
  conversations: number;
  paid: string;
  cost: string;
}

/**
 * Lista cu un buton „Credite” pe fiecare rând: formularul se deschide sub
 * rând, fără să pleci din listă. Pentru detalii complete, e-mailul duce la
 * pagina contului.
 */
export function UsersTable({ users, needle }: { users: UserListRow[]; needle: string }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-line">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="text-left text-[11px] tracking-[0.12em] text-paper-faint uppercase">
          <tr className="border-b border-ink-line">
            <th className="px-4 py-3 font-normal">E-mail</th>
            <th className="px-4 py-3 font-normal">Creat</th>
            <th className="px-4 py-3 font-normal">Activ</th>
            <th className="px-4 py-3 text-right font-normal">Șed.</th>
            <th className="px-4 py-3 text-right font-normal">Transf.</th>
            <th className="px-4 py-3 text-right font-normal">Noduri</th>
            <th className="px-4 py-3 text-right font-normal">Conv.</th>
            <th className="px-4 py-3 text-right font-normal">Plătit</th>
            <th className="px-4 py-3 text-right font-normal">Cost</th>
            <th className="px-4 py-3 font-normal" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-line">
          {users.map((u) => {
            const open = openId === u.id;
            return (
              <Fragment key={u.id}>
                <tr className={open ? "bg-ink-soft/60" : "hover:bg-ink-soft/60"}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/utilizatori/${u.id}`} className="text-paper hover:underline">
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-paper-faint">{u.created}</td>
                  <td className="px-4 py-3 text-paper-faint">{u.active}</td>
                  <td className="px-4 py-3 text-right">{u.sessions}</td>
                  <td className="px-4 py-3 text-right">{u.transformations}</td>
                  <td className="px-4 py-3 text-right text-paper-dim">{u.nodes}</td>
                  <td className="px-4 py-3 text-right text-paper-dim">{u.conversations}</td>
                  <td className="px-4 py-3 text-right text-paper-dim">{u.paid}</td>
                  <td className="px-4 py-3 text-right text-paper-faint">{u.cost}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setOpenId(open ? null : u.id)}
                      className={`rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors ${
                        open
                          ? "border-paper bg-paper text-ink"
                          : "border-ink-line text-paper-dim hover:border-paper-faint hover:text-paper"
                      }`}
                    >
                      {open ? "Închide" : "+ Credite"}
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="bg-ink-soft/40">
                    <td colSpan={10} className="px-4 py-4">
                      <div className="max-w-md">
                        <CreditForm userId={u.id} email={u.email} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {users.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-6 text-center text-paper-faint">
                Nimic pentru „{needle}”.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
