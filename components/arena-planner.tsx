/* eslint-disable @typescript-eslint/no-use-before-define */
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Map,
  PlusCircle,
  Shuffle,
  Target,
  UploadCloud
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/cn";

type TargetAssignment = "Alpha" | "Bravo" | "Charlie" | "Delta" | "Unassigned";
type ThreatLevel = "Low" | "Medium" | "High" | "Critical";
type TargetMeta = {
  id: string;
  label: string;
  x: number;
  y: number;
  threat: ThreatLevel;
  assignment: TargetAssignment;
  lastUpdated: number;
};

const importSchema = z.object({
  arena: z.object({
    width: z.number().min(10).max(200),
    height: z.number().min(10).max(200)
  }),
  coverageRadius: z.number().min(2).max(80),
  targets: z
    .array(
      z.object({
        label: z.string(),
        x: z.number(),
        y: z.number(),
        threat: z.enum(["Low", "Medium", "High", "Critical"]),
        assignment: z.enum(["Alpha", "Bravo", "Charlie", "Delta", "Unassigned"])
      })
    )
    .min(1)
});

type ImportedPayload = z.infer<typeof importSchema>;

const defaultTargets: TargetMeta[] = [
  {
    id: "unit-alpha-1",
    label: "Fuel Depot",
    x: 20,
    y: 32,
    threat: "Critical",
    assignment: "Alpha",
    lastUpdated: Date.now()
  },
  {
    id: "unit-bravo-2",
    label: "Radar Array",
    x: 58,
    y: 16,
    threat: "High",
    assignment: "Bravo",
    lastUpdated: Date.now()
  },
  {
    id: "unit-charlie-3",
    label: "VIP Escort",
    x: 78,
    y: 68,
    threat: "Medium",
    assignment: "Charlie",
    lastUpdated: Date.now()
  },
  {
    id: "unit-delta-4",
    label: "Orbital Relay",
    x: 42,
    y: 82,
    threat: "Low",
    assignment: "Unassigned",
    lastUpdated: Date.now()
  }
];

const assignmentPalette: Record<TargetAssignment, string> = {
  Alpha: "bg-blue-500",
  Bravo: "bg-green-500",
  Charlie: "bg-purple-500",
  Delta: "bg-orange-500",
  Unassigned: "bg-slate-500"
};

const threatPalette: Record<ThreatLevel, string> = {
  Low: "text-emerald-400",
  Medium: "text-amber-300",
  High: "text-orange-400",
  Critical: "text-rose-400"
};

const assignments: TargetAssignment[] = [
  "Alpha",
  "Bravo",
  "Charlie",
  "Delta",
  "Unassigned"
];

const threats: ThreatLevel[] = ["Low", "Medium", "High", "Critical"];

type ArenaPlannerState = {
  width: number;
  height: number;
  coverageRadius: number;
  targets: TargetMeta[];
};

const defaultState: ArenaPlannerState = {
  width: 100,
  height: 100,
  coverageRadius: 18,
  targets: defaultTargets
};

export function ArenaPlanner() {
  const [state, setState] = useState<ArenaPlannerState>(defaultState);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const { width, height, coverageRadius, targets } = state;

  const analytics = useMemo(() => computeArenaInsights(state), [state]);

  useEffect(() => {
    if (!activeId && state.targets.length > 0) {
      setActiveId(state.targets[0]?.id ?? null);
    } else if (
      activeId &&
      !state.targets.some((candidate) => candidate.id === activeId)
    ) {
      setActiveId(state.targets[0]?.id ?? null);
    }
  }, [activeId, state.targets]);

  return (
    <section className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.3em] text-blue-300/80">
          <Target className="h-4 w-4" />
          Mobile Arena Target Mapping
        </span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-white">
              Arena Target Assignment Check
            </h1>
            <p className="mt-1 text-sm text-slate-300/80">
              Evaluate target coverage posture, streamline mobile arena
              assignments, and validate routing envelopes in real time.
            </p>
          </div>
          <SampleLoader
            onLoad={(payload) => {
              setState((prev) => ({
                ...prev,
                width: payload.arena.width,
                height: payload.arena.height,
                coverageRadius: payload.coverageRadius,
                targets: payload.targets.map((target) => ({
                  ...target,
                  id: crypto.randomUUID(),
                  lastUpdated: Date.now()
                }))
              }));
              setImportError(null);
            }}
            error={importError}
            onError={setImportError}
          />
        </div>
      </header>

      <main className="grid grid-cols-1 gap-10 lg:grid-cols-[340px,_1fr]">
        <aside className="flex flex-col gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl">
          <SettingsPanel
            width={width}
            height={height}
            coverageRadius={coverageRadius}
            onChange={(partial) =>
              setState((prev) => ({ ...prev, ...partial }))
            }
          />

          <AssignmentOverview analytics={analytics} />
        </aside>

        <section className="flex flex-col gap-6">
          <ArenaMap
            width={width}
            height={height}
            coverageRadius={coverageRadius}
            targets={targets}
            activeId={activeId}
            onSelect={setActiveId}
          />

          <TargetDeck
            targets={targets}
            activeId={activeId}
            onSelect={setActiveId}
            onMutate={(mutator) =>
              setState((prev) => ({
                ...prev,
                targets: mutator(prev.targets)
              }))
            }
            coverageRadius={coverageRadius}
            arenaDimensions={{ width, height }}
          />
        </section>
      </main>
    </section>
  );
}

function SettingsPanel({
  width,
  height,
  coverageRadius,
  onChange
}: {
  width: number;
  height: number;
  coverageRadius: number;
  onChange: (partial: Partial<ArenaPlannerState>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase text-blue-200/70">
        <Map className="h-4 w-4" />
        Arena Envelope
      </div>

      <div className="grid gap-3">
        <label className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-surface-muted/60 p-4 transition hover:border-blue-500/60 hover:bg-surface-muted/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300/60">
              Arena Width
            </span>
            <span className="text-sm font-semibold text-slate-100">
              {width} m
            </span>
          </div>
          <input
            type="range"
            min={40}
            max={140}
            value={width}
            onChange={(event) => onChange({ width: Number(event.target.value) })}
            className="accent-blue-500"
          />
        </label>

        <label className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-surface-muted/60 p-4 transition hover:border-blue-500/60 hover:bg-surface-muted/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300/60">
              Arena Height
            </span>
            <span className="text-sm font-semibold text-slate-100">
              {height} m
            </span>
          </div>
          <input
            type="range"
            min={40}
            max={140}
            value={height}
            onChange={(event) =>
              onChange({ height: Number(event.target.value) })
            }
            className="accent-blue-500"
          />
        </label>

        <label className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-surface-muted/60 p-4 transition hover:border-blue-500/60 hover:bg-surface-muted/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300/60">
              Coverage Radius
            </span>
            <span className="text-sm font-semibold text-slate-100">
              {coverageRadius} m
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={60}
            value={coverageRadius}
            onChange={(event) =>
              onChange({ coverageRadius: Number(event.target.value) })
            }
            className="accent-blue-500"
          />
        </label>
      </div>
    </div>
  );
}

function AssignmentOverview({
  analytics
}: {
  analytics: ReturnType<typeof computeArenaInsights>;
}) {
  const statusIcon =
    analytics.coverage.health === "Optimal" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-amber-300" />
    );

  return (
    <div className="rounded-2xl border border-white/10 bg-surface-muted/50 p-5 shadow-ambient">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200/70">
          Assignment Snapshot
        </h2>
        {statusIcon}
      </header>

      <div className="mt-4 flex flex-col gap-4 text-sm text-slate-300">
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Coverage Health
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            {analytics.coverage.health}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {analytics.coverage.message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <SummaryCard
            label="Targets"
            primary={analytics.targets.total}
            secondary={`${analytics.targets.critical} critical`}
          />
          <SummaryCard
            label="Assignments"
            primary={`${analytics.assignments.assigned}/${analytics.targets.total}`}
            secondary={`${analytics.assignments.utilization.toFixed(0)}% coverage`}
          />
          <SummaryCard
            label="Overlaps"
            primary={analytics.overlaps.count}
            secondary={
              analytics.overlaps.count
                ? `${analytics.overlaps.count} targets share envelope`
                : "No conflicts"
            }
          />
          <SummaryCard
            label="Travel Load"
            primary={`${analytics.coverage.meanDistance.toFixed(1)} m`}
            secondary="Mean route stretch"
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  primary,
  secondary
}: {
  label: string;
  primary: number | string;
  secondary: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{primary}</p>
      <p className="mt-1 text-[11px] text-slate-400">{secondary}</p>
    </div>
  );
}

function ArenaMap({
  width,
  height,
  coverageRadius,
  targets,
  activeId,
  onSelect
}: {
  width: number;
  height: number;
  coverageRadius: number;
  targets: TargetMeta[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-muted/70">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.25em] text-slate-300/70">
        <span className="flex items-center gap-2">
          <Crosshair className="h-4 w-4" />
          Arena Envelope · {width}m × {height}m
        </span>
        <span>Coverage radius: {coverageRadius}m</span>
      </div>
      <div className="relative aspect-video bg-[linear-gradient(0deg,_rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[length:40px_40px]">
        <motion.div
          className="absolute inset-4 rounded-3xl border border-blue-500/20"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(37, 99, 235, 0.15)",
              "0 0 0 10px rgba(37, 99, 235, 0)",
              "0 0 0 0 rgba(37, 99, 235, 0)"
            ]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        {targets.map((target) => {
          const left = `${(target.x / width) * 100}%`;
          const top = `${(target.y / height) * 100}%`;
          const radiusInset = (coverageRadius / Math.max(width, height)) * 100;

          return (
            <button
              key={target.id}
              className="group absolute origin-center"
              style={{
                left,
                top,
                transform: "translate(-50%, -50%)"
              }}
              onClick={() => onSelect(target.id)}
            >
              <motion.div
                className={cn(
                  "relative flex h-20 w-20 items-center justify-center rounded-full bg-white/5 transition",
                  activeId === target.id
                    ? "ring-4 ring-blue-400/50"
                    : "ring-2 ring-white/5"
                )}
                whileHover={{ scale: 1.06 }}
              >
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-full opacity-60",
                    assignmentPalette[target.assignment]
                  )}
                  style={{ filter: "blur(45px)" }}
                  animate={{
                    scale: activeId === target.id ? [1, 1.1, 1] : [1, 1, 1],
                    opacity:
                      activeId === target.id
                        ? [0.6, 0.8, 0.6]
                        : [0.35, 0.45, 0.35]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                <div
                  className={cn(
                    "absolute inset-0 rounded-full border-2 border-dashed border-blue-300/30 transition",
                    activeId === target.id && "border-blue-400/70"
                  )}
                  style={{
                    padding: `${radiusInset}%`
                  }}
                />

                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900/90 text-xs font-semibold">
                  {target.label
                    .split(" ")
                    .map((word) => word.at(0))
                    .join("")
                    .slice(0, 3)
                    .toUpperCase()}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TargetDeck({
  targets,
  activeId,
  onSelect,
  onMutate,
  coverageRadius,
  arenaDimensions
}: {
  targets: TargetMeta[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onMutate: (mutator: (targets: TargetMeta[]) => TargetMeta[]) => void;
  coverageRadius: number;
  arenaDimensions: { width: number; height: number };
}) {
  const active = targets.find((target) => target.id === activeId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px),minmax(0,1fr)]">
      <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
          <span>Targets</span>
          <span>{targets.length} fixed</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-500/20"
            onClick={() =>
              onMutate((current) => [
                ...current,
                {
                  id: crypto.randomUUID(),
                  label: `Target ${current.length + 1}`,
                  x: clamp(Math.random() * arenaDimensions.width, 8, arenaDimensions.width - 8),
                  y: clamp(Math.random() * arenaDimensions.height, 8, arenaDimensions.height - 8),
                  threat: "Medium",
                  assignment: "Unassigned",
                  lastUpdated: Date.now()
                }
              ])
            }
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add Target
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-slate-200/40 hover:bg-slate-500/20"
            onClick={() =>
              onMutate(() =>
                defaultTargets.map((target) => ({
                  ...target,
                  id: crypto.randomUUID(),
                  lastUpdated: Date.now()
                }))
              )
            }
          >
            <Shuffle className="h-3.5 w-3.5" />
            Reset Grid
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {targets.map((target) => (
            <button
              key={target.id}
              className={cn(
                "flex items-center justify-between rounded-xl border border-transparent bg-slate-900/50 px-4 py-3 text-left transition hover:border-blue-400/30 hover:bg-slate-900/80",
                activeId === target.id && "border-blue-500/50"
              )}
              onClick={() => onSelect(target.id)}
            >
              <div>
                <div className="text-sm font-semibold text-white">
                  {target.label}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                  {target.assignment} ·{" "}
                  <span className={threatPalette[target.threat]}>
                    {target.threat}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">
                {target.x.toFixed(0)}m / {target.y.toFixed(0)}m
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/5 p-6">
        {active ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {active.label}
                </h3>
                <p className="text-xs text-slate-400">
                  Updated {timeSince(active.lastUpdated)} ago
                </p>
              </div>
              <button
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-red-300/80 transition hover:border-red-400/40 hover:text-red-200"
                onClick={() => {
                  onMutate((current) =>
                    current.filter((target) => target.id !== active.id)
                  );
                  onSelect(null);
                }}
              >
                Remove
              </button>
            </div>

            <div className="grid gap-4 text-xs uppercase tracking-[0.25em] text-slate-400">
              <label className="flex flex-col gap-2 text-left">
                <span>Label</span>
                <input
                  value={active.label}
                  onChange={(event) =>
                    onMutate((current) =>
                      current.map((target) =>
                        target.id === active.id
                          ? {
                              ...target,
                              label: event.target.value,
                              lastUpdated: Date.now()
                            }
                          : target
                      )
                    )
                  }
                  className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-base font-normal tracking-normal text-slate-200 outline-none transition focus:border-blue-400/60"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <AxisControl
                  label="X Position"
                  value={active.x}
                  max={arenaDimensions.width}
                  onChange={(value) =>
                    onMutate((current) =>
                      current.map((target) =>
                        target.id === active.id
                          ? {
                              ...target,
                              x: value,
                              lastUpdated: Date.now()
                            }
                          : target
                      )
                    )
                  }
                />
                <AxisControl
                  label="Y Position"
                  value={active.y}
                  max={arenaDimensions.height}
                  onChange={(value) =>
                    onMutate((current) =>
                      current.map((target) =>
                        target.id === active.id
                          ? {
                              ...target,
                              y: value,
                              lastUpdated: Date.now()
                            }
                          : target
                      )
                    )
                  }
                />
              </div>

              <label className="flex flex-col gap-2 text-left">
                <span>Threat Level</span>
                <div className="flex gap-2 tracking-normal">
                  {threats.map((threat) => (
                    <button
                      key={threat}
                      className={cn(
                        "flex-1 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold transition",
                        active.threat === threat
                          ? "border-white/40 bg-white/10 text-white"
                          : "bg-slate-950/50 text-slate-300 hover:border-white/20 hover:bg-slate-950/80"
                      )}
                      onClick={() =>
                        onMutate((current) =>
                          current.map((target) =>
                            target.id === active.id
                              ? {
                                  ...target,
                                  threat,
                                  lastUpdated: Date.now()
                                }
                              : target
                          )
                        )
                      }
                    >
                      {threat}
                    </button>
                  ))}
                </div>
              </label>

              <label className="flex flex-col gap-2 text-left">
                <span>Assignment</span>
                <div className="flex gap-2 tracking-normal">
                  {assignments.map((assignment) => (
                    <button
                      key={assignment}
                      className={cn(
                        "flex-1 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold transition",
                        active.assignment === assignment
                          ? "border-white/40 bg-white/10 text-white"
                          : "bg-slate-950/50 text-slate-300 hover:border-white/20 hover:bg-slate-950/80"
                      )}
                      onClick={() =>
                        onMutate((current) =>
                          current.map((target) =>
                            target.id === active.id
                              ? {
                                  ...target,
                                  assignment,
                                  lastUpdated: Date.now()
                                }
                              : target
                          )
                        )
                      }
                    >
                      {assignment}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <CoverageEvaluator
              target={active}
              coverageRadius={coverageRadius}
              arenaDimensions={arenaDimensions}
            />
          </>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-400">
            <Crosshair className="h-8 w-8 text-slate-500" />
            Select a target to inspect assignments, coverage, and routing.
          </div>
        )}
      </div>
    </div>
  );
}

function AxisControl({
  label,
  value,
  max,
  onChange
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <span>{label}</span>
      <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
        <div className="flex items-center justify-between text-xs tracking-normal text-slate-300">
          <span>{value.toFixed(1)} m</span>
          <span>{max} max</span>
        </div>
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="mt-3 w-full accent-blue-400"
        />
      </div>
    </div>
  );
}

function CoverageEvaluator({
  target,
  coverageRadius,
  arenaDimensions
}: {
  target: TargetMeta;
  coverageRadius: number;
  arenaDimensions: { width: number; height: number };
}) {
  const borderDistance = Math.min(
    target.x,
    arenaDimensions.width - target.x,
    target.y,
    arenaDimensions.height - target.y
  );

  const envelopeClearance = Math.max(borderDistance - coverageRadius, 0);

  const envelopeScore =
    coverageRadius >= borderDistance
      ? "In Envelope"
      : envelopeClearance < 6
        ? "Tight Clearance"
        : "Clear";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-300">
        <Crosshair className="h-4 w-4" />
        Coverage Diagnostics
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span>Envelope Status</span>
          <span className="font-semibold text-white">{envelopeScore}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Minimum Clearance</span>
          <span className="font-semibold text-white">
            {envelopeClearance.toFixed(1)} m
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Coverage Radius</span>
          <span className="font-semibold text-white">{coverageRadius} m</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center">
            <p>Assignment</p>
            <p className="mt-2 text-base font-semibold text-white">
              {target.assignment}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center">
            <p>Threat</p>
            <p className={cn("mt-2 text-base font-semibold", threatPalette[target.threat])}>
              {target.threat}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SampleLoader({
  onLoad,
  onError,
  error
}: {
  onLoad: (payload: ImportedPayload) => void;
  onError: (error: string | null) => void;
  error: string | null;
}) {
  const importExample = () => {
    const payload: ImportedPayload = {
      arena: { width: 120, height: 120 },
      coverageRadius: 24,
      targets: [
        {
          label: "Command Relay",
          x: 35,
          y: 40,
          threat: "High",
          assignment: "Alpha"
        },
        {
          label: "Forward Repair",
          x: 82,
          y: 55,
          threat: "Medium",
          assignment: "Bravo"
        },
        {
          label: "VIP Convoy",
          x: 68,
          y: 88,
          threat: "Critical",
          assignment: "Charlie"
        },
        {
          label: "Ammo Cache",
          x: 50,
          y: 20,
          threat: "Low",
          assignment: "Delta"
        }
      ]
    };

    onLoad(payload);
  };

  const handleImport = async () => {
    try {
      if (!navigator?.clipboard?.readText) {
        throw new Error("Clipboard API unavailable in this environment.");
      }
      const text = await navigator.clipboard.readText();
      const parsed = importSchema.parse(JSON.parse(text));
      onLoad(parsed);
    } catch (cause) {
      onError(
        cause instanceof Error
          ? cause.message
          : "Unable to import payload from clipboard."
      );
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-500/20"
          onClick={importExample}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Load Sample
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-blue-300/40 hover:text-white"
          onClick={handleImport}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Import Clipboard
        </button>
      </div>
      {error ? (
        <p className="text-xs text-rose-300/80">{error}</p>
      ) : (
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
          Paste arena payload JSON to clipboard → Import
        </p>
      )}
    </div>
  );
}

function computeArenaInsights(state: ArenaPlannerState) {
  const { targets, coverageRadius, width, height } = state;

  const total = targets.length;
  const critical = targets.filter((target) => target.threat === "Critical").length;
  const assigned = targets.filter((target) => target.assignment !== "Unassigned").length;

  const utilization = total === 0 ? 0 : (assigned / total) * 100;

  const overlaps = computeOverlapConflicts(targets, coverageRadius);

  const meanDistance =
    targets.reduce((accumulator, target) => accumulator + distanceToCenter(target, width, height), 0) /
    Math.max(targets.length, 1);

  const coverageHealth =
    assigned === total && overlaps.count === 0
      ? "Optimal"
      : assigned >= total * 0.6 && overlaps.count < total * 0.2
        ? "Acceptable"
        : "Degraded";

  const healthMessage =
    coverageHealth === "Optimal"
      ? "All targets tracked with clean envelopes and no assignment conflicts."
      : coverageHealth === "Acceptable"
        ? "Monitor overlapping coverage and resolve unassigned targets soon."
        : "Critical routing issues detected. Redistribute squads and expand coverage.";

  return {
    targets: { total, critical },
    assignments: { assigned, utilization },
    overlaps,
    coverage: {
      health: coverageHealth,
      message: healthMessage,
      meanDistance
    }
  };
}

function computeOverlapConflicts(targets: TargetMeta[], coverageRadius: number) {
  const radius = coverageRadius;
  const conflicts: { pair: [TargetMeta, TargetMeta]; distance: number }[] = [];

  for (let index = 0; index < targets.length; index += 1) {
    for (let other = index + 1; other < targets.length; other += 1) {
      const a = targets[index]!;
      const b = targets[other]!;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < radius * 1.3) {
        conflicts.push({ pair: [a, b], distance });
      }
    }
  }

  return {
    count: conflicts.length,
    conflicts
  };
}

function distanceToCenter(target: TargetMeta, width: number, height: number) {
  return Math.hypot(target.x - width / 2, target.y - height / 2);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function timeSince(timestamp: number) {
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
