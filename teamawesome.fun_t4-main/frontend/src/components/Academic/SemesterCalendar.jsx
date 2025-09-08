import { useState } from "react";
import styles from "./SemesterCalendar.module.css";

const SemesterCalendar = ({ 
  selectedSemester, 
  selectedYear, 
  onSemesterSelect, 
  onYearSelect, 
  required = false 
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 2);
  
  const semesters = [
    { value: "Semester 1", label: "Semester 1", period: "Feb - Jun" },
    { value: "Semester 2", label: "Semester 2", period: "Jul - Nov" },
    { value: "Summer Semester", label: "Summer Semester", period: "Dec - Jan" },
    { value: "Trimester 1", label: "Trimester 1", period: "Feb - May" },
    { value: "Trimester 2", label: "Trimester 2", period: "Jun - Sep" },
    { value: "Trimester 3", label: "Trimester 3", period: "Oct - Jan" }
  ];

  return (
    <div className={styles.semesterCalendar}>
      <label className={styles.label}>
        Academic Period {required && <span className={styles.required}>*</span>}
      </label>
      
      <div className={styles.calendarGrid}>
        <div className={styles.yearSelector}>
          <label htmlFor="year" className={styles.subLabel}>Year</label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => onYearSelect(parseInt(e.target.value))}
            className={styles.yearSelect}
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.semesterSelector}>
          <label className={styles.subLabel}>Semester</label>
          <div className={styles.semesterGrid}>
            {semesters.map((semester) => (
              <div
                key={semester.value}
                className={`${styles.semesterCard} ${
                  selectedSemester === semester.value ? styles.selected : ""
                }`}
                onClick={() => onSemesterSelect(semester.value)}
              >
                <div className={styles.semesterLabel}>
                  {semester.label}
                </div>
                <div className={styles.semesterPeriod}>
                  {semester.period}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedSemester && selectedYear && (
        <div className={styles.selectedPeriod}>
          <strong>Selected:</strong> {selectedSemester} {selectedYear}
        </div>
      )}
    </div>
  );
};

export default SemesterCalendar;