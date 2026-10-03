// Hand-rolled SVG bar chart — no charting library. A few dozen data points
// with no zoom/pan/interactivity beyond a native hover tooltip doesn't
// justify one.
export function BarChart({
  data,
  formatValue = (value) => String(value),
  height = 140,
}: {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  height?: number;
}) {
  if (data.length === 0) {
    return <p className="text-caption">No data for this range.</p>;
  }

  const max = Math.max(...data.map((point) => point.value), 1);
  const barSlot = 100 / data.length;
  const barWidth = barSlot * 0.7;
  const chartHeight = height - 20;
  // Avoid overlapping labels when there are many bars (e.g. a 90-day range)
  // — show a subset, always including the last one.
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-36 w-full">
        {data.map((point, index) => {
          const barHeight = (point.value / max) * chartHeight;
          return (
            <rect
              key={`${point.label}-${index}`}
              x={index * barSlot + (barSlot - barWidth) / 2}
              y={chartHeight - barHeight}
              width={barWidth}
              height={Math.max(barHeight, point.value > 0 ? 1 : 0)}
              className="fill-brand"
              rx={0.6}
            >
              <title>
                {point.label}: {formatValue(point.value)}
              </title>
            </rect>
          );
        })}
      </svg>
      <div className="text-caption mt-1 flex">
        {data.map((point, index) => (
          <div key={`${point.label}-${index}`} style={{ width: `${barSlot}%` }} className="truncate text-center">
            {index % labelEvery === 0 || index === data.length - 1 ? point.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
