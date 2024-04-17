import { dirname } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

/** @typedef {import("./Localization/Localization.mjs").Localization} Localization */

export class GenerateManifestJsons {
    /**
     * @type {Localization | null}
     */
    #localization;

    /**
     * @param {Localization | null} localization
     * @returns {Promise<GenerateManifestJsons>}
     */
    static async new(localization = null) {
        return new this(
            localization
        );
    }

    /**
     * @param {Localization | null} localization
     * @private
     */
    constructor(localization) {
        this.#localization = localization;
    }

    /**
     * @param {{[key: string]: *}} manifest_template
     * @param {string} manifest_json_file
     * @param {string | null} localization_module
     * @returns {Promise<void>}
     */
    async generateManifestJsons(manifest_template, manifest_json_file, localization_module = null) {
        if (localization_module !== null) {
            if (this.#localization === null) {
                throw new Error("Missing Localization!");
            }
        }

        const manifest_json_file_dot_pos = manifest_json_file.lastIndexOf(".");

        for (const language of [
            ...(localization_module !== null ? Object.keys(await this.#localization.getLanguages(
                true
            )) : null) ?? [],
            ""
        ]) {
            const localized_manifest_json_file = language !== "" ? `${manifest_json_file.substring(0, manifest_json_file_dot_pos)}-${language}${manifest_json_file.substring(manifest_json_file_dot_pos)}` : manifest_json_file;

            console.log(`Generate ${localized_manifest_json_file}`);

            const localized_manifest = structuredClone(manifest_template);

            localized_manifest.lang = language !== "" ? language : manifest_template.lang ?? "";

            if (localization_module !== null && localized_manifest.lang !== "") {
                for (const key of [
                    "description",
                    "name",
                    "short_name"
                ]) {
                    if ((localized_manifest[key] ?? "") === "") {
                        continue;
                    }

                    localized_manifest[key] = await this.#localization.translate(
                        localization_module,
                        localized_manifest[key],
                        null,
                        localized_manifest.lang
                    );
                }

                localized_manifest.dir = (await this.#localization.getLanguage(
                    localized_manifest.lang
                )).direction;
            }

            await mkdir(dirname(localized_manifest_json_file), {
                recursive: true
            });

            await writeFile(localized_manifest_json_file, `${JSON.stringify(localized_manifest, null, 4)}\n`);
        }
    }
}
