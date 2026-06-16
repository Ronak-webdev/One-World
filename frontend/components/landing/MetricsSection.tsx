import { CountUp } from "@/components/ui/CountUp";
import { metrics } from "@/lib/constants";

export function MetricsSection() {
  return (
    <section className="bg-surface-secondary py-20">
      <div className="mx-auto grid max-w-content overflow-hidden rounded-2xl border border-black/10 bg-white md:grid-cols-4">
        {metrics.map((metric) => (
          <div className="border-black/10 p-8 md:border-r md:last:border-r-0" key={metric.value}>
            <div className="text-4xl font-bold">
              <CountUp value={metric.value} />
            </div>
            <p className="mt-3 max-w-[13rem] text-sm leading-6 text-text-secondary">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

