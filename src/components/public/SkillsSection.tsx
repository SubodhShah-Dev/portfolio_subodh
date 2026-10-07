import type { Skill } from "../../types/skill";

import { Section } from "./Section";

interface SkillsSectionProps {
  skills: Skill[];
  index?: number;
}

interface SkillGroup {
  category: string;
  items: Skill[];
}

/** Groups skills by their data-driven category, preserving order (§9). */
function groupByCategory(skills: Skill[]): SkillGroup[] {
  const groups: SkillGroup[] = [];
  const indexByCategory = new Map<string, number>();
  for (const skill of skills) {
    const existing = indexByCategory.get(skill.category);
    if (existing === undefined) {
      indexByCategory.set(skill.category, groups.length);
      groups.push({ category: skill.category, items: [skill] });
    } else {
      groups[existing].items.push(skill);
    }
  }
  return groups;
}

export function SkillsSection({ skills, index }: SkillsSectionProps) {
  const groups = groupByCategory(skills);

  return (
    <Section id="skills" title="Skills" index={index}>
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.category || "all"}>
            {group.category.trim() !== "" && (
              <h3 className="font-meta text-xs tracking-widest text-ink/80 uppercase">
                {group.category}
              </h3>
            )}
            <ul
              className={`flex flex-wrap gap-2.5 ${
                group.category.trim() !== "" ? "mt-3.5" : ""
              }`}
            >
              {group.items.map((skill) => (
                <li
                  key={skill.id}
                  className="rounded-full border border-ink/30 bg-paper-raised/60 px-3.5 py-1.5 text-sm text-ink transition-colors hover:border-accent/40 hover:text-ink"
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
