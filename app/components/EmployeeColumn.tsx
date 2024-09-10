import React from "react";
import { Employee } from "../types/scheduler";

interface EmployeeColumnProps {
  groupedEmployees: [string, Employee[]][];
  renderGroupSeparator: (text: string) => JSX.Element;
  renderSearchBar: () => JSX.Element;
  hoveredEmployee: string | null;
}

const EmployeeColumn: React.FC<EmployeeColumnProps> = ({
  groupedEmployees,
  renderGroupSeparator,
  renderSearchBar,
  hoveredEmployee,
}) => {
  return (
    <div className={`w-48 flex-shrink-0 flex flex-col bg-white`}>
      {renderGroupSeparator("")}
      {renderSearchBar()}
      <div className="flex-grow overflow-y-auto">
        {groupedEmployees.map(([role, employees], groupIndex) => (
          <React.Fragment key={role}>
            {groupIndex > 0 && (
              <>
                {renderGroupSeparator("")}
                {renderSearchBar()}
              </>
            )}
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`flex items-center p-2 border-l border-b border-r border-gray-300 h-[46px]
                  ${
                    hoveredEmployee === employee.id ? "bg-lightblue z-[49]" : ""
                  }`}
                style={{
                  boxShadow:
                    hoveredEmployee === employee.id
                      ? "0px 0px 10px 3px lightblue"
                      : "none",
                }}
              >
                <img
                  src={`https://xsgames.co/randomusers/avatar.php?g=pixel&id=${employee.id}`}
                  alt={employee.name}
                  className="w-8 h-8 rounded-full mr-2"
                />
                <div>
                  <div className="font-semibold text-sm">{employee.name}</div>
                </div>
              </div>
            ))}
            <div className="flex items-center h-[54px] bg-gray-100 border-r border-gray-300 border-t border-b border-l bg-white">
              <span className="text-md font-medium text-gray-600 pl-3">
                Total: {employees.length}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default EmployeeColumn;
