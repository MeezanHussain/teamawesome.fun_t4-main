import { useState } from "react";
import styles from "./UnitSelector.module.css";

const UnitSelector = ({ units, selectedUnit, onUnitSelect, required = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredUnits = units.filter(unit =>
    unit.unit_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUnitSelect = (unit) => {
    onUnitSelect(unit.unit_code);
    setIsOpen(false);
    setSearchTerm("");
  };

  const selectedUnitData = units.find(unit => unit.unit_code === selectedUnit);

  return (
    <div className={styles.unitSelector}>
      <label className={styles.label}>
        Unit Code {required && <span className={styles.required}>*</span>}
      </label>
      
      <div className={styles.dropdown}>
        <div 
          className={styles.selectedUnit}
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedUnitData ? (
            <div className={styles.unitInfo}>
              <span className={styles.unitCode}>{selectedUnitData.unit_code}</span>
              <span className={styles.unitName}>{selectedUnitData.unit_name}</span>
            </div>
          ) : (
            <span className={styles.placeholder}>Select a unit...</span>
          )}
          <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>▼</span>
        </div>

        {isOpen && (
          <div className={styles.dropdownMenu}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.unitsList}>
              {filteredUnits.map((unit) => (
                <div
                  key={unit.unit_code}
                  className={`${styles.unitItem} ${
                    selectedUnit === unit.unit_code ? styles.selected : ""
                  }`}
                  onClick={() => handleUnitSelect(unit)}
                >
                  <div className={styles.unitCode}>{unit.unit_code}</div>
                  <div className={styles.unitName}>{unit.unit_name}</div>
                  <div className={styles.unitFaculty}>{unit.faculty}</div>
                </div>
              ))}
              
              {filteredUnits.length === 0 && (
                <div className={styles.noResults}>No units found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitSelector;