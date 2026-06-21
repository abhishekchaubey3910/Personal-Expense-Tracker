package com.expense.tracker.repository;

import com.expense.tracker.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // Find expenses by category
    List<Expense> findByCategory(String category);

    // Find expenses between two dates (for monthly reports)
    List<Expense> findByDateBetween(LocalDate startDate, LocalDate endDate);

    // Get total amount grouped by category
    @Query("SELECT e.category, SUM(e.amount) FROM Expense e GROUP BY e.category")
    List<Object[]> getCategorySummary();

    // Get total amount grouped by category for a specific month
    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.date BETWEEN ?1 AND ?2 GROUP BY e.category")
    List<Object[]> getCategorySummaryBetween(LocalDate startDate, LocalDate endDate);
}
