import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BuyCreditsProps {
  onPurchase: (type: "credits") => void;
}

export const BuyCredits = ({ onPurchase }: BuyCreditsProps) => {
  const [customAmount, setCustomAmount] = useState("");

  const presetAmounts = [
    { minutes: 60, price: 10 },
    { minutes: 180, price: 25 },
    { minutes: 360, price: 45 },
    { minutes: 600, price: 70 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {presetAmounts.map((preset) => (
          <Card key={preset.minutes} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl">{preset.minutes} min</CardTitle>
              <CardDescription>${preset.price}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => onPurchase("credits")}>
                Buy Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Amount</CardTitle>
          <CardDescription>Purchase a custom number of minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="custom-minutes">Minutes</Label>
              <Input
                id="custom-minutes"
                type="number"
                placeholder="Enter minutes"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => onPurchase("credits")} disabled={!customAmount}>
                Purchase
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
