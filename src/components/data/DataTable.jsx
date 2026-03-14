import { useState } from "react";
import { SkeletonTable } from "../ui/Spinner.jsx";
import { EmptyState }    from "../ui/Spinner.jsx";

// =============================================================================
// DataTable
//
// Generic table component used throughout every manager and admin page.
//
// Props:
//   columns   — Column[]   (see Column type below)
//   data      — object[]   row data
//   loading   — boolean
//   emptyIcon — string     icon key for EmptyState (default "box")
//   emptyTitle— string
//   emptyDesc — string
//   onRowClick— fn(row)    makes rows clickable
//   rowKey    — string     key prop name (default "id")
//   stickyHeader — boolean (default false)
//   striped   — boolean    alternating row shading
//   compact   — boolean    tighter row height
//
// Column shape:
//   {
//     key:      string             — matches row[key]
//     label:    string             — header label
//     width?:   string | number    — CSS width
//     align?:   "left"|"right"|"center"
//     sortable? boolean
//     render?:  fn(value, row) → ReactNode   — custom cell renderer
//   }
//
// Usage:
//   <DataTable
//     columns={[
//       { key: "name",   label: "Resident", render: (v, row) => <Avatar name={v} src={row.avatar} /> },
//       { key: "room",   label: "Room",     width: 100 },
//       { key: "status", label: "Status",   render: v => <Badge variant={v} /> },
//       { key: "due",    label: "Due",      align: "right", sortable: true },
//     ]}
//     data={residents}
//     loading={isLoading}
//     onRowClick={r => navigate(`/manage/residents/${r.id}`)}
//   />
// =============================================================================

function SortIcon({ direction }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {direction === "asc"  && <path d="M12 19V5M5 12l7-7 7 7"/>}
      {direction === "desc" && <path d="M12 5v14M5 12l7 7 7-7"/>}
      {!direction           && <><path d="M12 5v14" strokeOpacity="0.3"/><path d="M5 9l7-4 7 4M5 15l7 4 7-4" strokeOpacity="0.35"/></>}
    </svg>
  );
}

export default function DataTable({
  columns       = [],
  data          = [],
  loading       = false,
  emptyIcon     = "box",
  emptyTitle    = "No data yet",
  emptyDesc     = "Records will appear here once available.",
  onRowClick,
  rowKey        = "id",
  stickyHeader  = false,
  striped       = false,
  compact       = false,
}) {
  const [sortKey, setSortKey]     = useState(null);
  const [sortDir, setSortDir]     = useState("asc");

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Client-side sort (server sort: pass sorted data in)
  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  const rowH = compact ? 44 : 56;

  if (loading) return <SkeletonTable rows={5} cols={columns.length || 4} />;

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE4D8", overflow: "hidden" }}>
      {data.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
            {/* Header */}
            <thead>
              <tr style={{ background: "#FAF7F2", borderBottom: "1.5px solid #EDE4D8" }}>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{
                      padding:    compact ? "10px 16px" : "12px 16px",
                      textAlign:  col.align ?? "left",
                      fontSize:   11,
                      fontWeight: 700,
                      color:      "#8B7355",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      cursor:     col.sortable ? "pointer" : "default",
                      userSelect: "none",
                      width:      col.width,
                      position:   stickyHeader ? "sticky" : "static",
                      top:        stickyHeader ? 0 : undefined,
                      background: stickyHeader ? "#FAF7F2" : "transparent",
                      zIndex:     stickyHeader ? 1 : undefined,
                      transition: "color 0.15s",
                    }}
                    onMouseOver={e => { if (col.sortable) e.currentTarget.style.color = "#C5612C"; }}
                    onMouseOut={e  => { if (col.sortable) e.currentTarget.style.color = "#8B7355"; }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {col.label}
                      {col.sortable && (
                        <span style={{ color: sortKey === col.key ? "#C5612C" : "inherit", opacity: sortKey === col.key ? 1 : 0.5 }}>
                          <SortIcon direction={sortKey === col.key ? sortDir : null} />
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {sorted.map((row, ri) => (
                <tr
                  key={row[rowKey] ?? ri}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    height:      rowH,
                    background:  striped && ri % 2 === 1 ? "#FDFAF7" : "#fff",
                    borderBottom: ri < sorted.length - 1 ? "1px solid #F5EDE0" : "none",
                    cursor:      onRowClick ? "pointer" : "default",
                    transition:  "background 0.12s",
                  }}
                  onMouseOver={e => { if (onRowClick) e.currentTarget.style.background = "#FFFAF6"; }}
                  onMouseOut={e  => { e.currentTarget.style.background = striped && ri % 2 === 1 ? "#FDFAF7" : "#fff"; }}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      style={{
                        padding:   compact ? "0 16px" : "0 16px",
                        textAlign: col.align ?? "left",
                        fontSize:  14,
                        color:     "#1A1412",
                        maxWidth:  col.width ?? 220,
                        overflow:  "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: col.render ? "normal" : "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
