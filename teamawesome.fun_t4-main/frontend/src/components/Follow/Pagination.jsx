import styles from "./Pagination.module.css";

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = Math.max(1, ((currentPage || 1) - 1) * (itemsPerPage || 5) + 1);
  const endItem = Math.min((currentPage || 1) * (itemsPerPage || 5), totalItems || 0);

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  return (
    <div className={styles.paginationContainer}>
      {/* Items per page selector */}
      <div className={styles.itemsPerPageContainer}>
        <label htmlFor="itemsPerPage" className={styles.itemsPerPageLabel}>
          Show:
        </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
          className={styles.itemsPerPageSelect}
          disabled={isLoading}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
        <span className={styles.itemsPerPageText}>per page</span>
      </div>

      {/* Results info */}
      <div className={styles.resultsInfo}>
        Showing {startItem}-{endItem} of {totalItems} users
      </div>

      {/* Pagination controls */}
      <div className={styles.paginationControls}>
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={`${styles.paginationButton} ${styles.prevButton}`}
          aria-label="Previous page"
        >
          <span className={styles.chevron}>‹</span>
          Previous
        </button>

        {/* Page numbers */}
        <div className={styles.pageNumbers}>
          {pageNumbers[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className={styles.paginationButton}
                disabled={isLoading}
              >
                1
              </button>
              {pageNumbers[0] > 2 && (
                <span className={styles.ellipsis}>...</span>
              )}
            </>
          )}
          
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`${styles.paginationButton} ${
                pageNum === currentPage ? styles.activePage : ""
              }`}
              disabled={isLoading}
              aria-label={`Page ${pageNum}`}
              aria-current={pageNum === currentPage ? "page" : undefined}
            >
              {pageNum}
            </button>
          ))}
          
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className={styles.ellipsis}>...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className={styles.paginationButton}
                disabled={isLoading}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={`${styles.paginationButton} ${styles.nextButton}`}
          aria-label="Next page"
        >
          Next
          <span className={styles.chevron}>›</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
