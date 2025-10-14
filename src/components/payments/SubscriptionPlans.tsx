import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface SubscriptionPlansProps {
  onSelectPlan: (plan: string) => void;
}

export const SubscriptionPlans = ({ onSelectPlan }: SubscriptionPlansProps) => {
  const plans = [
    {
      name: "Basic",
      price: 29,
      features: ["100 minutes/month", "Basic support", "Email notifications"],
    },
    {
      name: "Pro",
      price: 79,
      features: ["500 minutes/month", "Priority support", "Advanced analytics", "API access"],
      popular: true,
    },
    {
      name: "Enterprise",
      price: 199,
      features: ["Unlimited minutes", "24/7 support", "Custom integrations", "Dedicated account manager"],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.name} className={plan.popular ? "border-primary" : ""}>
          <CardHeader>
            {plan.popular && (
              <div className="text-xs font-semibold text-primary mb-2">MOST POPULAR</div>
            )}
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant={plan.popular ? "default" : "outline"}
              onClick={() => onSelectPlan(plan.name)}
            >
              Choose {plan.name}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
