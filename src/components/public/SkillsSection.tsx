import type { Skill } from "../../types/skill";

import { Section } from "./Section";

interface SkillsSectionProps {
  skills: Skill[];
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

export function SkillsSection({ skills }: SkillsSectionProps) {
  const groups = groupByCategory(skills);

  return (
    <Section id="skills" title="Skills">
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.category || "all"}>
            {group.category.trim() !== "" && (
              <h3 className="text-sm font-medium text-slate-300">{group.category}</h3>
            )}
            <ul
              className={`flex flex-wrap gap-2 ${group.category.trim() !== "" ? "mt-2" : ""}`}
            >
              {group.items.map((skill) => (
                <li
                  key={skill.id}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
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
