import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock, DollarSign } from "lucide-react";
import { PaymentMethodDialog } from "@/components/payments/PaymentMethodDialog";
import { PaymentHistory } from "@/components/payments/PaymentHistory";
import { SubscriptionPlans } from "@/components/payments/SubscriptionPlans";
import { BuyCredits } from "@/components/payments/BuyCredits";
import { useAuth } from "@/hooks/useAuth";

const Payments = () => {
  const { user } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentType, setPaymentType] = useState<"subscription" | "credits">("credits");

  const { data: credits } = useQuery({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credits")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payments & Credits</h1>
          <p className="text-muted-foreground">Manage your subscription and purchase credits</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credits?.balance || 0}</div>
              <p className="text-xs text-muted-foreground">Minutes remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Free</div>
              <p className="text-xs text-muted-foreground">Current plan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiry Date</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {credits?.expires_at ? new Date(credits.expires_at).toLocaleDateString() : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Credits expire on</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="buy" className="space-y-6">
          <TabsList>
            <TabsTrigger value="buy">Buy Credits</TabsTrigger>
            <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="buy">
            <BuyCredits onPurchase={(type) => {
              setPaymentType(type);
              setShowPaymentDialog(true);
            }} />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionPlans onSelectPlan={() => {
              setPaymentType("subscription");
              setShowPaymentDialog(true);
            }} />
          </TabsContent>

          <TabsContent value="history">
            <PaymentHistory />
          </TabsContent>
        </Tabs>

        <PaymentMethodDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          paymentType={paymentType}
        />
      </div>
    </div>
  );
};

export default Payments;
