"use client";

import React, { useEffect, useState } from 'react';
import CreateBudget from "@/app/(routes)/dashboard/budgets/_components/CreateBudget"; 
import { db } from "@/utils/dbConfig"; 
import { eq, getTableColumns, sql } from "drizzle-orm";
import { Budgets, Expenses } from "@/utils/schema"; 
import { useUser } from "@clerk/nextjs";
import BudgetItem from "@/app/(routes)/dashboard/budgets/_components/BudgetItem"; 

function BudgetList() {
  const [budgetList, setBudgetList] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      console.log("Logged-in user: ", user);
      getBudgetList();
    }
  }, [user]);

  const getBudgetList = async () => {
    if (!user) return;

    const result = await db
      .select({
        ...getTableColumns(Budgets),
        totalSpend: sql`sum(${Expenses.amount})`.mapWith(Number),
        totalItem: sql`count(${Expenses.id})`.mapWith(Number),
        paymentMethod: sql`array_agg(${Expenses.payment_method})`.mapWith(String),
      })
      .from(Budgets)
      .leftJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
      .where(eq(Budgets.createdBy, user?.primaryEmailAddress?.emailAddress))
      .groupBy(Budgets.id);

    console.log("Budget List: ", result);
    setBudgetList(result);
  };

  return (
    <div className="mt-7 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 h-full">
        <CreateBudget refreshData={getBudgetList} />
        {budgetList.length ? (
          budgetList.map((budget) => <BudgetItem key={budget.id} budget={budget} />)
        ) : (
          <div className="w-full col-span-full text-center mt-7">
            <p className="text-white font-bold text-2xl">No budget? Let's start saving your money!</p>
            <p className="text-gray-400 mt-2">Create your first budget and take control of your finances.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetList;
