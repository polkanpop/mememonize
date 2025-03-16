import { Box, Container, Typography, Link, Grid, Divider } from "@mui/material"

function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: "background.paper", py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Mememonize Trading
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A decentralized trading platform for digital assets.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <Link href="/" color="inherit" display="block" sx={{ mb: 1 }}>
              Home
            </Link>
            <Link href="/marketplace" color="inherit" display="block" sx={{ mb: 1 }}>
              Marketplace
            </Link>
            <Link href="/transactions" color="inherit" display="block" sx={{ mb: 1 }}>
              Transactions
            </Link>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: support@mememonize.com
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: +1 (123) 456-7890
            </Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          {"© "}
          {new Date().getFullYear()}
          {" Mememonize Trading. All rights reserved."}
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer

