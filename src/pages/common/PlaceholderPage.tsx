import { FileText, Plus, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="px-4 py-1.5 text-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="px-4 py-1.5 text-sm"
            >
              <FileText className="mr-1.5 h-4 w-4" />
              Export
            </Button>

            <Button
              size="sm"
              className="bg-[#1a2a3a] px-4 py-1.5 text-sm hover:bg-[#2a3f56]"
            >
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      <div className="mx-auto mt-2 max-w-2xl rounded-lg border border-[#e5e7eb] bg-white p-10 text-center text-[#6b7280] shadow-sm">
        <div className="mb-4 text-[#d1d5db]">
          <FileText
            className="mx-auto h-12 w-12"
            strokeWidth={1.5}
          />
        </div>

        <h3 className="text-lg font-medium text-[#1a2332]">
          {title}
        </h3>

        <p className="mt-1 text-sm">
          This page is under construction.
        </p>

        <div className="mt-4">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Coming soon
          </span>
        </div>
      </div>
    </>
  );
}