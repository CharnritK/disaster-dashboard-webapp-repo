import {
  createMetadataDbAdapter,
  InMemoryMetadataDbAdapter,
  type MetadataDbAdapter,
} from "@/lib/db/metadataAdapter";

const globalForMetadata = globalThis as typeof globalThis & {
  __dashboardCopilotMetadataAdapter?: MetadataDbAdapter;
};

export function getMetadataDbAdapter() {
  globalForMetadata.__dashboardCopilotMetadataAdapter ??=
    process.env.METADATA_STORE === "supabase"
      ? createMetadataDbAdapter()
      : new InMemoryMetadataDbAdapter();

  return globalForMetadata.__dashboardCopilotMetadataAdapter;
}

export function resetMetadataDbAdapterForTests() {
  globalForMetadata.__dashboardCopilotMetadataAdapter = new InMemoryMetadataDbAdapter();
}
