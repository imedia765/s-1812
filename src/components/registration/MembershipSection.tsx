import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

interface MembershipSectionProps {
  onCollectorChange?: (collectorId: string) => void;
}

export const MembershipSection = ({ onCollectorChange }: MembershipSectionProps) => {
  const [collectors, setCollectors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCollector, setSelectedCollector] = useState<string>("");

  useEffect(() => {
    const fetchCollectors = async () => {
      const { data, error } = await supabase
        .from('collectors')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error("Error fetching collectors:", error);
        return;
      }

      setCollectors(data || []);
      // Set the first collector as default if available
      if (data && data.length > 0) {
        setSelectedCollector(data[0].id);
        onCollectorChange?.(data[0].id);
      }
    };

    fetchCollectors();
  }, [onCollectorChange]);

  const handleCollectorChange = (value: string) => {
    setSelectedCollector(value);
    onCollectorChange?.(value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Membership Information</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="collector">Select Collector</Label>
          <Select value={selectedCollector} onValueChange={handleCollectorChange}>
            <SelectTrigger id="collector">
              <SelectValue placeholder="Select a collector" />
            </SelectTrigger>
            <SelectContent>
              {collectors.map((collector) => (
                <SelectItem key={collector.id} value={collector.id}>
                  {collector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Membership Fee</h4>
          <p>Registration fee: £150</p>
          <p>Annual fee: £40 (collected £20 in January and £20 in June)</p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="giftAid" />
          <label htmlFor="giftAid">I am eligible for Gift Aid</label>
        </div>

        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox id="terms" required />
            <label htmlFor="terms" className="text-sm">
              I/We Hereby confirm the above details provided are genuine and valid. I/We also understand
              that submitting an application or making payment does not obligate PWA Burton On Trent to
              grant Membership. Membership will only be approved once all criteria are met, Supporting
              documents presented, Payment made in Full and approval is informed by the Management of PWA
              Burton On Trent. I/We understand and agree that it is my/our duty and responsibility to
              notify PWA Burton On Trent of ALL changes in circumstance in relation to myself/ALL those
              under this Membership, at my/our earliest convenience.
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};