"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HomeBlocks, HomeFeature } from "@/lib/cms/types";

type Props = {
  value: HomeBlocks;
  onChange: (next: HomeBlocks) => void;
};

export function HomeBlocksEditor({ value, onChange }: Props) {
  function patchHero(patch: Partial<HomeBlocks["hero"]>) {
    onChange({ ...value, hero: { ...value.hero, ...patch } });
  }

  function patchShowcase(patch: Partial<HomeBlocks["showcase"]>) {
    onChange({ ...value, showcase: { ...value.showcase, ...patch } });
  }

  function patchCta(patch: Partial<HomeBlocks["bottomCta"]>) {
    onChange({ ...value, bottomCta: { ...value.bottomCta, ...patch } });
  }

  function updateFeature(index: number, patch: Partial<HomeFeature>) {
    onChange({
      ...value,
      features: value.features.map((f, i) =>
        i === index ? { ...f, ...patch } : f,
      ),
    });
  }

  function addFeature() {
    onChange({
      ...value,
      features: [
        ...value.features,
        {
          title: "New feature",
          description: "Describe this capability for visitors.",
          imageUrl: "/menu/menu-burger.jpg",
        },
      ],
    });
  }

  function removeFeature(index: number) {
    onChange({
      ...value,
      features: value.features.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold">Hero</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Eyebrow"
            value={value.hero.eyebrow}
            onChange={(e) => patchHero({ eyebrow: e.target.value })}
          />
          <Input
            label="Hero image URL"
            value={value.hero.imageUrl}
            onChange={(e) => patchHero({ imageUrl: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label="Headline"
              value={value.hero.headline}
              onChange={(e) => patchHero({ headline: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Subheadline"
              value={value.hero.subheadline}
              onChange={(e) => patchHero({ subheadline: e.target.value })}
              className="min-h-24"
            />
          </div>
          <Input
            label="Primary CTA label"
            value={value.hero.primaryCtaLabel}
            onChange={(e) => patchHero({ primaryCtaLabel: e.target.value })}
          />
          <Input
            label="Primary CTA href"
            value={value.hero.primaryCtaHref}
            onChange={(e) => patchHero({ primaryCtaHref: e.target.value })}
          />
          <Input
            label="Secondary CTA label"
            value={value.hero.secondaryCtaLabel}
            onChange={(e) => patchHero({ secondaryCtaLabel: e.target.value })}
          />
          <Input
            label="Secondary CTA href"
            value={value.hero.secondaryCtaHref}
            onChange={(e) => patchHero({ secondaryCtaHref: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold">Features section</h3>
        <Input
          label="Heading"
          value={value.featuresHeading}
          onChange={(e) =>
            onChange({ ...value, featuresHeading: e.target.value })
          }
        />
        <Textarea
          label="Subheading"
          value={value.featuresSubheading}
          onChange={(e) =>
            onChange({ ...value, featuresSubheading: e.target.value })
          }
          className="min-h-20"
        />

        <div className="space-y-4 pt-2">
          {value.features.map((feature, index) => (
            <div
              key={`feature-${index}`}
              className="space-y-3 rounded-xl border border-line bg-background/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Feature {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeature(index)}
                  disabled={value.features.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                label="Title"
                value={feature.title}
                onChange={(e) => updateFeature(index, { title: e.target.value })}
              />
              <Textarea
                label="Description"
                value={feature.description}
                onChange={(e) =>
                  updateFeature(index, { description: e.target.value })
                }
                className="min-h-24"
              />
              <Input
                label="Animated photo URL"
                value={feature.imageUrl}
                onChange={(e) =>
                  updateFeature(index, { imageUrl: e.target.value })
                }
                placeholder="/menu/menu-burger.jpg"
              />
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" onClick={addFeature}>
          <Plus className="h-4 w-4" />
          Add feature
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold">Owner modules section</h3>
        <Input
          label="Modules heading"
          value={value.modulesHeading ?? ""}
          onChange={(e) =>
            onChange({ ...value, modulesHeading: e.target.value })
          }
        />
        <Textarea
          label="Modules subheading"
          value={value.modulesSubheading ?? ""}
          onChange={(e) =>
            onChange({ ...value, modulesSubheading: e.target.value })
          }
          className="min-h-20"
        />
        <p className="text-xs text-muted">
          Module cards (dashboard, POS, kitchen, WhatsApp, reports, etc.) use
          platform defaults unless customized in seed/JSON.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold">Showcase</h3>
        <Input
          label="Title"
          value={value.showcase.title}
          onChange={(e) => patchShowcase({ title: e.target.value })}
        />
        <Textarea
          label="Description"
          value={value.showcase.description}
          onChange={(e) => patchShowcase({ description: e.target.value })}
          className="min-h-24"
        />
        <Input
          label="Image URL"
          value={value.showcase.imageUrl}
          onChange={(e) => patchShowcase({ imageUrl: e.target.value })}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold">Bottom CTA</h3>
        <Input
          label="Title"
          value={value.bottomCta.title}
          onChange={(e) => patchCta({ title: e.target.value })}
        />
        <Textarea
          label="Description"
          value={value.bottomCta.description}
          onChange={(e) => patchCta({ description: e.target.value })}
          className="min-h-20"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Button label"
            value={value.bottomCta.buttonLabel}
            onChange={(e) => patchCta({ buttonLabel: e.target.value })}
          />
          <Input
            label="Button href"
            value={value.bottomCta.buttonHref}
            onChange={(e) => patchCta({ buttonHref: e.target.value })}
          />
        </div>
      </section>
    </div>
  );
}
