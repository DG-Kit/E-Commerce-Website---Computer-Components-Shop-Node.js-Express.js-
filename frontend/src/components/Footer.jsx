import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Link, 
  List, 
  ListItem, 
  Divider,
  IconButton,
  InputBase,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Send as SendIcon
} from '@mui/icons-material';

const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  '&:hover': {
    color: '#f59e0b',
    textDecoration: 'none',
  },
}));

const FooterSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const SocialIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&:hover': {
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
}));

const Footer = () => {
  return (
    <Box sx={{ bgcolor: '#f9fafb', pt: 6, pb: 3, mt: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* About section */}
          <Grid item xs={12} md={4}>
            <FooterSection>
              <Box sx={{ mb: 2 }}>
                <img
                  src="/images/logo-transparent.png"
                  alt="K-Store Logo"
                  style={{ height: '120px', width: '120px' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Chuyên cung cấp các linh kiện máy tính, laptop và các sản phẩm công nghệ chính hãng với giá tốt nhất thị trường.
              </Typography>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <SocialIconButton aria-label="facebook">
                  <FacebookIcon />
                </SocialIconButton>
                <SocialIconButton aria-label="youtube">
                  <YouTubeIcon />
                </SocialIconButton>
                <SocialIconButton aria-label="instagram">
                  <InstagramIcon />
                </SocialIconButton>
                <SocialIconButton aria-label="twitter">
                  <TwitterIcon />
                </SocialIconButton>
              </Box>
            </FooterSection>
          </Grid>

          {/* Links section */}
          <Grid item xs={12} sm={6} md={2}>
            <FooterSection>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Thông tin
              </Typography>
              <List dense disablePadding>
                <ListItem disableGutters>
                  <FooterLink href="/about">Giới thiệu</FooterLink>
                </ListItem>
                <ListItem disableGutters>
                  <FooterLink href="/contact">Liên hệ</FooterLink>
                </ListItem>
                <ListItem disableGutters>
                  <FooterLink href="/blog">Blog</FooterLink>
                </ListItem>
                <ListItem disableGutters>
                  <FooterLink href="/careers">Tuyển dụng</FooterLink>
                </ListItem>
              </List>
            </FooterSection>
          </Grid>

          {/* Support section */}
          <Grid item xs={12} sm={6} md={2}>
            <FooterSection>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Hỗ trợ
              </Typography>
              <List dense disablePadding>
                <ListItem disableGutters>
                  <FooterLink href="/faq">FAQ</FooterLink>
                </ListItem>
                <ListItem disableGutters>
                  <FooterLink href="/shipping">Chính sách vận chuyển</FooterLink>
                </ListItem>
                <ListItem disableGutters>
                  <FooterLink href="/returns">Chính sách đổi trả</FooterLink>
                </ListItem>
                <ListItem disableGutters>
                  <FooterLink href="/warranty">Bảo hành</FooterLink>
                </ListItem>
              </List>
            </FooterSection>
          </Grid>

          {/* Contact section */}
          <Grid item xs={12} md={4}>
            <FooterSection>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Liên hệ với chúng tôi
              </Typography>
              <List dense disablePadding>
                <ListItem disableGutters sx={{ mb: 1 }}>
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    83-85 Thái Hà - Đống Đa - Hà Nội<br />
                    83A Cầu Long - Q10 - TP.HCM
                  </Typography>
                </ListItem>
                <ListItem disableGutters sx={{ mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    0968 239 497 - 097 221 6881
                  </Typography>
                </ListItem>
                <ListItem disableGutters sx={{ mb: 2 }}>
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    contact@tteshop.vn
                  </Typography>
                </ListItem>
              </List>
              
              <Box sx={{ display: 'flex' }}>
                <InputBase
                  placeholder="Nhập email của bạn"
                  sx={{ 
                    bgcolor: 'white', 
                    p: '6px 10px',
                    borderRadius: '4px 0 0 4px',
                    flex: 1,
                    border: '1px solid #e0e0e0',
                    borderRight: 'none'
                  }}
                />
                <Button
                  sx={{ 
                    bgcolor: '#f59e0b', 
                    color: 'white',
                    borderRadius: '0 4px 4px 0',
                    '&:hover': {
                      bgcolor: '#d97706'
                    }
                  }}
                >
                  <SendIcon fontSize="small" />
                </Button>
              </Box>
            </FooterSection>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} K-Store. Tất cả các quyền được bảo lưu.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 