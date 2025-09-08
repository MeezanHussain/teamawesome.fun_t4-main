import { useState, useEffect } from "react";
import api from "../../../utils/api";
import SwinburneProjectCard from "./SwinburneProjectCard";
import styles from "./TeamFinder.module.css";

const TeamFinder = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [filters, setFilters] = useState({
    unit_code: "",
    campus: "",
    project_type: "",
    semester: "",
    search: ""
  });

  const [availableFilters, setAvailableFilters] = useState({
    units: [],
    campuses: [],
    types: [],
    semesters: []
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, filters]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await api.get("/swinburne-projects/team-finder");
      const projectData = response.data.projects;
      
      setProjects(projectData);
      extractFilterOptions(projectData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const extractFilterOptions = (projectData) => {
    const units = [...new Set(projectData.map(p => p.unit_code))].sort();
    const campuses = [...new Set(projectData.map(p => p.campus))].sort();
    const types = [...new Set(projectData.map(p => p.project_type))].sort();
    const semesters = [...new Set(projectData.map(p => `${p.semester} ${p.academic_year}`))].sort().reverse();
    
    setAvailableFilters({
      units,
      campuses,
      types,
      semesters
    });
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.unit_name.toLowerCase().includes(searchLower) ||
        project.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Unit filter
    if (filters.unit_code) {
      filtered = filtered.filter(project => project.unit_code === filters.unit_code);
    }

    // Campus filter
    if (filters.campus) {
      filtered = filtered.filter(project => project.campus === filters.campus);
    }

    // Project type filter
    if (filters.project_type) {
      filtered = filtered.filter(project => project.project_type === filters.project_type);
    }

    // Semester filter
    if (filters.semester) {
      filtered = filtered.filter(project => 
        `${project.semester} ${project.academic_year}` === filters.semester
      );
    }

    setFilteredProjects(filtered);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      unit_code: "",
      campus: "",
      project_type: "",
      semester: "",
      search: ""
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== "");

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Finding open projects...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>Team Finder</h1>
          <p>Discover Swinburne projects looking for collaborators</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{filteredProjects.length}</span>
            <span className={styles.statLabel}>Open Projects</span>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchProjects}>Try Again</button>
        </div>
      )}

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersHeader}>
          <h3>Filter Projects</h3>
          {hasActiveFilters && (
            <button className={styles.clearFilters} onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>

        <div className={styles.filters}>
          {/* Search */}
          <div className={styles.searchFilter}>
            <input
              type="text"
              placeholder="Search projects, descriptions, units..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          {/* Filter dropdowns */}
          <div className={styles.filterDropdowns}>
            <select
              value={filters.unit_code}
              onChange={(e) => updateFilter("unit_code", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Units</option>
              {availableFilters.units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>

            <select
              value={filters.campus}
              onChange={(e) => updateFilter("campus", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Campuses</option>
              {availableFilters.campuses.map(campus => (
                <option key={campus} value={campus}>{campus}</option>
              ))}
            </select>

            <select
              value={filters.project_type}
              onChange={(e) => updateFilter("project_type", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Types</option>
              {availableFilters.types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filters.semester}
              onChange={(e) => updateFilter("semester", e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Semesters</option>
              {availableFilters.semesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className={styles.activeFilters}>
            {filters.search && (
              <span className={styles.activeFilter}>
                Search: "{filters.search}"
                <button onClick={() => updateFilter("search", "")}>×</button>
              </span>
            )}
            {filters.unit_code && (
              <span className={styles.activeFilter}>
                Unit: {filters.unit_code}
                <button onClick={() => updateFilter("unit_code", "")}>×</button>
              </span>
            )}
            {filters.campus && (
              <span className={styles.activeFilter}>
                Campus: {filters.campus}
                <button onClick={() => updateFilter("campus", "")}>×</button>
              </span>
            )}
            {filters.project_type && (
              <span className={styles.activeFilter}>
                Type: {filters.project_type}
                <button onClick={() => updateFilter("project_type", "")}>×</button>
              </span>
            )}
            {filters.semester && (
              <span className={styles.activeFilter}>
                Semester: {filters.semester}
                <button onClick={() => updateFilter("semester", "")}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className={styles.results}>
        {filteredProjects.length === 0 ? (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>🔍</div>
            <h3>No projects found</h3>
            <p>
              {hasActiveFilters 
                ? "Try adjusting your filters to see more projects."
                : "There are currently no open projects looking for collaborators."
              }
            </p>
            {hasActiveFilters && (
              <button className={styles.clearFiltersButton} onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.projectsGrid}>
            {filteredProjects.map(project => (
              <SwinburneProjectCard
                key={project.id}
                project={project}
                showCollaborators={true}
                showProgress={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamFinder;