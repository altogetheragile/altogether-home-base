
import { Button } from "@/components/ui/button";

const NoEventsMessage = () => {
  return (
    <div className="text-center mt-16 p-8 bg-muted/50 rounded-lg">
      <h3 className="text-2xl font-semibold text-foreground mb-4">
        No Events Scheduled
      </h3>
      <p className="text-muted-foreground mb-6">
        We're preparing exciting new training sessions and workshops. 
        Check back soon for upcoming events!
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline">
          Subscribe to Updates
        </Button>
        <Button variant="outline">
          Contact Us
        </Button>
      </div>
    </div>
  );
};

export default NoEventsMessage;
