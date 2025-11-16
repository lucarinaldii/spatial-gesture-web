import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OBJImporterProps {
  onImport: (file: File, fileName: string) => void;
}

export const OBJImporter = ({ onImport }: OBJImporterProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.obj')) {
      toast({
        title: "Invalid file",
        description: "Please select an OBJ file",
        variant: "destructive",
      });
      return;
    }

    onImport(file, file.name);
    
    toast({
      title: "Object imported",
      description: `${file.name} loaded successfully`,
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".obj"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Import OBJ
      </Button>
    </>
  );
};
