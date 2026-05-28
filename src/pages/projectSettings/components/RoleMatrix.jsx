// feat(pages/projectSettings/components/RoleMatrix): show which permissions each project role grants, with a per-role action menu.
import Button from "../../../components/ui/Button.jsx";
import Dropdown from "../../../components/ui/Dropdown.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";

export default function RoleMatrix({ roles, canManage, onEdit, onDelete }) {
  const permissions = [...new Set(roles.flatMap((r) => r.permissions ?? []))].sort();

  return (
    <div className="overflow-x-auto">
      <table className="tbl" aria-label="Permission matrix">
        <thead>
          <tr>
            <th scope="col">Permission</th>
            {roles.map((role) => (
              <th key={role._id} scope="col">
                <span className="inline-flex items-center gap-[6px]">
                  {role.isSystem ? <Icon name="lock" cls="text-faint" label="System role" /> : null}
                  <span className="text-text">{role.name}</span>
                  {canManage ? (
                    <Dropdown
                      label={`Actions for ${role.name}`}
                      items={[
                        { id: "edit", label: "Edit permissions", icon: "pen", onSelect: () => onEdit?.(role) },
                        ...(role.isSystem
                          ? []
                          : [{ id: "delete", label: "Delete role", icon: "trash", danger: true, onSelect: () => onDelete?.(role) }]),
                      ]}
                      trigger={(triggerProps) => (
                        <Button
                          iconOnly
                          variant="ghost"
                          size="sm"
                          icon="more"
                          aria-label={`Actions for ${role.name}`}
                          {...triggerProps}
                        />
                      )}
                    />
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission) => (
            <tr key={permission} className="hover:bg-surface-2">
              <th scope="row" className="font-semibold text-text">
                {permission}
              </th>
              {roles.map((role) => {
                const granted = (role.permissions ?? []).includes(permission);
                return (
                  <td key={role._id}>
                    {granted ? (
                      <Icon name="check" cls="text-good" label={`${role.name} has ${permission}`} />
                    ) : (
                      <span aria-label={`${role.name} does not have ${permission}`} className="text-faint">
                        -
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
